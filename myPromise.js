// 使用IIFE作为模块化,将promise挂载到window上

(function(window){

  // 三个状态：
  const PENDING = "pending"
  const RESOLVED = "resolved"
  const REJECTED = "rejected"

  // Promise构造函数
  //使用者传入的 executor立即执行函数，参数是resolve和reject

  function Promise(executor){
     
    //将当前promise实例保存起来
    const self = this;

    // 保存状态,初始值为pending
    self.status = PENDING;

    // 保存resolve和reject的参数value\reason
    self.data = undefined;

    // 用来保存状态改变后要执行的函数
    // 每个元素结构：{ onResolved() {}, onRejected() {}}
    self.callbacks = [];

    function resolve(value){
       // 如果当前状态不是pending,直接结束
      if(self.status !== PENDING){
        return 
      }

      self.status = RESOLVED;
      self.data = value;

      //如果有待执行的callbacks函数，立即异步执行回调函数onResolved
      if(self.callbacks.length > 0){
        setTimeout(()=>{
          self.callbacks.forEach(cb =>{

            cb.onResolved(value)

          })
         
        })
      }
    }

    function reject(reason){
      if(self.status != PENDING){
        return
      }
      self.status = REJECTED
      self.data = reason

      if(self.callbacks.length >0){
        setTimeout(() =>{
          self.callbacks.forEach(cb =>{
            cb.onRejected(reason)
          })
        })
      }
    }

     //立即同步执行excutor
    try{
      executor(resolve,reject)
    }catch(e){
      //如果执行器抛出异常，promise对象变为rejected
      reject(e)
    }

  }

  // prototype上的方法都是promise实例的方法
  // then中可以传递两个参数，成功后的回调和失败后的回调，返回一个新的promise对象
  Promise.prototype.then = function(onResolved, onRejected){

    // 不是函数则执行默认的回调函数
    onResolved = typeof onResolved === "function" ? onResolved : value => value
    onRejected = typeof onRejected === "function" ? onRejected : reason => reason

    const self = this

    return new Promise((resolve,reject) =>{

      // 定义对回调函数的处理函数：当状态还是pending时，将then传递的连个处理函数，用handle包装后放到callback队列
      function handle(cb){

        // 把then的函数参数用try和catch包装
        try{

          const result = cb(self.data)

          // 如果执行的结果仍然是promise，就采用他的状态
          if(result instanceof Promise){
            result.then(resolve,reject)
          }else{
            resolve(result)
          }

        }catch(e){
          reject(e)
        }
      }

      if(self.status === PENDING){

        self.callbacks.push({
          onResolved(){
            handle(onResolved)
          },
          onRejected(){
            handle(onRejected)
          }
        })

      }else if (self.status === RESOLVED){

        setTimeout(()=>{
          handle(onResolved)
        })

      }else{
        setTimeout(()=>{

          handle(onRejected)

        })
      }
      
    })

  }

  Promise.prototype.catch = function(onRejected){
    return this.then(undefined,onRejected)
  }

  // value如果是个promise,则value中的executor在其定义时就执行完了
  // 如果vaule是在其他地方定义，则executor在其他地方执行
  // 如果vaule是在作为Promise.resolve参数的时候定义，则executor在传参的时候执行
  // 因此如果value如果是个promise,他被传给 Promise.resolve作为参数，其状态肯定是已经变化的
  Promise.resolve = function(value){

    return new Promise((resolve,reject)=>{
      if(value instanceof Promise){
        //使用value的结果作为当前promise结果
        // 如果value的结果是好的，则会走then中的resolve。将当前这个返回的promies状态改变，这样外部就拿到了好的结果
        // 这样外部Promise.resolve.then(成功函数，失败函数)就会调用成功函数
        value.then(resolve,reject)
      }else{
        resolve(value)
      }
    })
  }

  Promise.resolve = function(reason){
    return new Promise((reject,resolve)=>{
      reject(reason)
    })
  }

  Promise.all = function(promises){

    // 空数组，长度为传进来的promise的数量，用来保存成功值
    const values = new Array(promises.length)

    let resolveCount = 0

    return new Promise((resolve,reject)=>{

      promises.forEach((onePromise,index)=>{
        // onePromise作为Promise.resolve的参数，其executor会立即执行，状态改变，进入then中的成功或者失败
        Promise.resolve(onePromise).then(
          (value)=>{
            resolveCount++
            values[index] = value

            //如果全部成功，将return的promise改为成功
            if(resolveCount === promises.length){
              // 将成功回调的值数组返回
              resolve(values)
            }
          },
          // 只要有一个失败了，所有都失败
          (reason)=>{
            reject(reason)
          }
        )
      })
    })
  }

  Promise.race = function(prmises){

    return new Promise((resolve,reject)=>{
      // 最先完成状态改变的promise就是最终的结果
      promises.forEach((onePromise)=>{
        Promise.resolve(onePromise).then(

          (value)=>{
            resolve(value)
          },
          (reason)=>{
            reject(reason)
          }

        )
      })
    })
  }

  // 返回一个promise对象，在指定的时间后确定结果
  Promise.resolveDelay = function(value,time){
    return new Promise((resolve,reject)=>{
      setInterval(() => {

        if(value instanceof Promise){
          value.then(resolve,reject)
        }else{
          resolve(value)
        }
        
      }, time);
    })
  }

  // 返回一个promise对象，在指定的时间之后失败
  Promise.rejectDelay = function (reason,time){
    return new  Promise((resolve,reject)=>{
      setTimeout(() => {
        reject(reason)
      }, time);
    })
  }

  window.Promise = Promise


})(window)


