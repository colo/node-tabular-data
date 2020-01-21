const debug = require('debug')('node-tabular-data'),
    debug_internals = require('debug')('node-tabular-data:Internals')

const eachOf = require( 'async' ).eachOf

/**
* https://gist.github.com/penguinboy/762197
*/
var flattenObject = function(ob) {

  return Object.keys(ob).reduce(function(toReturn, k) {

    if (Object.prototype.toString.call(ob[k]) === '[object Date]') {
      toReturn[k] = ob[k].toString();
    }
    else if ((typeof ob[k]) === 'object' && ob[k]) {
      var flatObject = flattenObject(ob[k]);
      Object.keys(flatObject).forEach(function(k2) {
        toReturn[k + '.' + k2] = flatObject[k2];
      });
    }
    else {
      toReturn[k] = ob[k];
    }

    return toReturn;
  }, {});
}


var nested_object_to_tabular = function (current, watcher){
	watcher = watcher || {value: ''}
	watcher.value = watcher.value || ''

	let data = []
	// Array.each(current, function(item){
  for(let index = 0; index < current.length; index++){
    let item = current[index]

		let tmp_data = {}
		//tmp_data.timestamp = new Date(item.timestamp)
		tmp_data.timestamp = item.timestamp *1


		let value = null

		if(watcher.value != ''){
			value = {}

			if(Array.isArray(watcher.value)){

				let flat = flattenObject(item.value)

				Object.each(flat, function (val, line){
					// console.log(line)
					let arr_line = line.split('.')
					let found = true
					/**
					* compare each watcher.value against each line "item", if all match => found = true
					**/
					Array.each(watcher.value, function(watcher_value, index){
						if(watcher_value instanceof RegExp){
							if(watcher_value.test(arr_line[index]) == false)
								found = false
						}
						else{
							if(arr_line[index] != watcher_value)
								found = false
						}
					})

					if(found == true){

						let arr_line = line.split('.')
						/**
						* recurse over item.value (updating val reference until last "key"),
						* to get the deep value of the full key
						**/
						let val = item.value
						Array.each(arr_line, function(key){
							val = val[key]
						})
						value[line] = val
					}

				})

			}
			else{
				value[watcher.value] = item.value[watcher.value]
			}


		}
		else{
			value = item.value
		}

		tmp_data.value = value

		data.push(tmp_data)

    if(index == current.length -1)
      return data
  }
	// })

	// console.log('nested_object_to_tabular')
	// console.log(data)

	// return data
}

var array_to_tabular = function (current, watcher){
	watcher = watcher || {value: ''}
	watcher.value = watcher.value || ''

	let data = []
	// Array.each(current, function(item){


  for(let index = 0; index < current.length; index++){
    let item = current[index]

		let tmp_data = []
		//tmp_data.push(new Date(item.timestamp))
		tmp_data.push(item.timestamp * 1)

		let value = null
    // console.log('ITEM', item)
		if(watcher.value != '' && !Array.isArray(watcher.value)){
			value = item.value[watcher.value]
		}
		else{
			value = item.value
		}

		// Array.each(value, function(real_value){
		//   tmp_data.push(real_value)
		// })
		if(Array.isArray(value)){
      Array.each(value, function(real_value){
				tmp_data.push(real_value)
			})
		}
		else if(!isNaN(value)){//mounts[mount_point].value.percentage
      tmp_data.push(value * 1)
		}
    else if(typeof value === 'string'){//mounts[mount_point].value.percentage
      tmp_data.push(value)
		}
		else if(!value){//mounts[mount_point].value.percentage
			//this is an error?
		}
		else{
			Object.each(value, function(real_value){
				real_value = real_value * 1
				tmp_data.push(real_value)
			})
		}

		// tmp_data.push(0)//add minute column

		data.push(tmp_data)

    if(index == current.length -1)
      return data
  }
	// })

	// return data
}

var number_to_tabular = function(current, watcher){
	let data = []
	// Array.each(current, function(current){
  for(let index = 0; index < current.length; index++){
    let item = current[index]

		let value = null
		if(watcher.value && watcher.value != '' && !Array.isArray(watcher.value)){
			value = item.value[watcher.value]
		}
		else{
			value = item.value
		}


		//data.push([new Date(current.timestamp), value])//0, minute column
		data.push([item.timestamp * 1, value])//0, minute column

    if(index == current.length -1)
      return data
  }
	// })

	// return data
}

var nested_array_to_tabular = function (current, watcher, name){

	let index = (name.substring(name.indexOf('_') +1 , name.length - 1)) * 1
	////////////////console.log('generic_data_watcher isNanN', name, val, index)

	let val_current = []
	// Array.each(current, function(item){
  for(let index = 0; index < current.length; index++){
    let item = current[index]
		// ////////////////console.log('CPU item', item)

		let value = {}
		Array.each(item.value, function(val, value_index){//each cpu

			if(watcher.merge !== true && value_index == index){////no merging - compare indexes to add to this watcher
				value[watcher.value] = Object.clone(val[watcher.value])
			}
			else{//merge all into a single stat
				if(value_index == 0){
					value[watcher.value] = Object.clone(val[watcher.value])
				}
				else{
					Object.each(val[watcher.value], function(prop, key){
						value[watcher.value][key] += prop
					})

				}
			}

		}.bind(this))

		val_current.push({timestamp: item.timestamp, value: value})

    if(index == current.length -1)
      return val_current
  }
	// }.bind(this))

	// ////////////////console.log('CPU new current', val_current)

	// return val_current
}

const data_to_stat = function(current, chart, name, updater_callback){
  let watcher = chart.watch || {}

  if(watcher.managed == true){
    watcher.transform(current, this, chart, updater_callback)
  }
  else{
    let type_value = undefined
    let value_length = 0
    let watcher_value = watcher.value

    if(watcher.value && watcher.value != ''){

      if(Array.isArray(watcher.value)){
        if(!(watcher.value[0] instanceof RegExp)){
          // Object.each(stat[0].value, function(val, key){
          // 	/**
          // 	* watch out to have a good RegExp, or may keep matching keeps 'til last one
          // 	**/
          // 	if(chart.watch.value[0].test(key))
          // 		obj = stat[0].value[key]
          // })
          watcher_value = watcher.value[0]
          type_value = (Array.isArray(current[0].data) && current[0].data[0][watcher_value]) ? current[0].value[0][watcher_value] : current[0].data[watcher_value]
        }
        else{//RegExp
          if(Array.isArray(current[0].data)){
            Object.each(current[0].data[0], function(val, key){
              if(watcher.value[0].test(key))
                type_value = current[0].data[0][key]
            })
          }
          else{
            Object.each(current[0].data, function(val, key){
              if(watcher.value[0].test(key))
                type_value = current[0].data[key]
            })


          }

        }

      }
      else{
        type_value = (Array.isArray(current[0].data) && current[0].data[0][watcher_value]) ? current[0].data[0][watcher_value] : current[0].data[watcher_value]
      }

    }
    else if(current[0] && (current[0].data || !isNaN(current[0].data))){
      type_value = current[0].data
    }

    let data = []

    // if(watcher && watcher.transform)
    //   console.log('WATCHER', typeof watcher.transform)


    // if(type_value && Array.isArray(type_value)){//multiple values, ex: loadavg

      debug_internals('data_to_stat',type_value )

      if(watcher.exclude){
        Array.each(current, function(data){
          Object.each(data.data, function(value, key){
            if(watcher.exclude.test(key) == true)
              delete data.data[key]
          })
        })
      }

      // let __process_array_to_tabular = function(current){
      //   let data = array_to_tabular(current, watcher)
      //   updater_callback(name, data)
      // }


      if(typeOf(watcher.transform) == 'function'){
        // current = watcher.transform(current, this, chart)
        let data = watcher.transform(current, this, chart, data => updater_callback(name, data))
        // // if(data && ! /function/.test(data))
        // if(data)
        //   __process_array_to_tabular(data)

      }
      else{
        // __process_array_to_tabular(current)
      }

  }


}

const data_to_tabular = function(current, chart, name, updater_callback){
  let watcher = chart.watch || {}

  if(watcher.managed == true){
    watcher.transform(current, this, chart, updater_callback)
  }
  else{
    let type_value = undefined
    let value_length = 0
    let watcher_value = watcher.value

    if(watcher.value && watcher.value != ''){

      if(Array.isArray(watcher.value)){
        if(!(watcher.value[0] instanceof RegExp)){
          // Object.each(stat[0].value, function(val, key){
          // 	/**
          // 	* watch out to have a good RegExp, or may keep matching keeps 'til last one
          // 	**/
          // 	if(chart.watch.value[0].test(key))
          // 		obj = stat[0].value[key]
          // })
          watcher_value = watcher.value[0]
          type_value = (Array.isArray(current[0].value) && current[0].value[0][watcher_value]) ? current[0].value[0][watcher_value] : current[0].value[watcher_value]
        }
        else{//RegExp
          if(Array.isArray(current[0].value)){
            Object.each(current[0].value[0], function(val, key){
              if(watcher.value[0].test(key))
                type_value = current[0].value[0][key]
            })
          }
          else{
            Object.each(current[0].value, function(val, key){
              if(watcher.value[0].test(key))
                type_value = current[0].value[key]
            })


          }

        }

      }
      else{
        type_value = (Array.isArray(current[0].value) && current[0].value[0][watcher_value]) ? current[0].value[0][watcher_value] : current[0].value[watcher_value]
      }

    }
    else if(current[0] && (current[0].value || !isNaN(current[0].value))){
      type_value = current[0].value
    }

    let data = []

    // if(watcher && watcher.transform)
    //   console.log('WATCHER', typeof watcher.transform)


    if(type_value && Array.isArray(type_value)){//multiple values, ex: loadavg

      if(watcher.exclude){
        Array.each(current, function(data){
          Object.each(data.value, function(value, key){
            if(watcher.exclude.test(key) == true)
              delete data.value[key]
          })
        })
      }

      let __process_array_to_tabular = function(current){
        let data = array_to_tabular(current, watcher)
        updater_callback(name, data)
      }


      if(typeOf(watcher.transform) == 'function'){
        // current = watcher.transform(current, this, chart)
        let data = watcher.transform(current, this, chart, __process_array_to_tabular)
        // if(data && ! /function/.test(data))
        if(data)
          __process_array_to_tabular(data)

      }
      else{
        // data = array_to_tabular(current, watcher)
        __process_array_to_tabular(current)
      }


    }
    else if(
      type_value
      && (isNaN(type_value) || watcher.value != '')
      && !(
        !Array.isArray(current[0].value)
        &&
        (
          watcher_value
          && isNaN(current[0].value[watcher_value])
        )
      )
    ){

      if(Array.isArray(current[0].value) && current[0].value[0][watcher.value]){//cpus
        current = nested_array_to_tabular(current, watcher, name)
      }

      // else{//blockdevices.sdX
      if(watcher.exclude){
        Array.each(current, function(data){
          Object.each(data.value, function(value, key){
            if(watcher.exclude.test(key) == true)
              delete data.value[key]
          })
        })
      }

      let __process_array_to_tabular = function(current){
        if(!Array.isArray(current))
          current = [current]

        // console.log('current, watcher', current, watcher)

        let data = array_to_tabular(current, watcher)
        debug_internals('data_to_tabular ', type_value, typeOf(type_value), current[0].value, data)
        updater_callback(name, data)
      }

      if(typeOf(watcher.transform) == 'function'){
        // current = watcher.transform(current, this, chart)
        let data = watcher.transform(current, this, chart, __process_array_to_tabular)
        // console.log('DATA', data, typeof data)

        // if(data && ! /function/.test(data))
        if(data)
          __process_array_to_tabular(data)
      }
      else{
        __process_array_to_tabular(current)
      }


      // if(!Array.isArray(current))
      // 	current = [current]
      //
      // data = array_to_tabular(current, watcher)

    }
    else if(
      type_value
      && (isNaN(type_value) || watcher_value != '')
      && (
        !Array.isArray(current[0].value)
        &&
        (
          watcher_value
          && isNaN(current[0].value[watcher_value])
        )
      )
    ){//like os.minute.cpus



      current = nested_object_to_tabular(current, watcher, name)


      if(watcher.exclude){
        Array.each(current, function(data){
          let obj = undefined
          if(data.value[watcher_value]){
            obj = data.value[watcher_value]
          }
          else{
            obj = data.value
          }

          Object.each(obj, function(value, key){
            if(watcher.exclude.test(key) == true)
              delete obj[key]
          })
        })
      }


      let __process_array_to_tabular = function(current){
        let data = array_to_tabular(current, watcher)
        updater_callback(name, data)
      }

      if(typeOf(watcher.transform) == 'function'){
        let data = watcher.transform(current, this, chart, __process_array_to_tabular)

        // if(data && ! /function/.test(data))
        if(data)
          __process_array_to_tabular(data)
      }
      else{
        __process_array_to_tabular(current)
      }

      // data = array_to_tabular(current, watcher)

    }
    else if(type_value || !isNaN(type_value)){//single value, ex: uptime
      // console.log('data_to_tabular', name, type_value)

      let __process_number_to_tabular = function(current){
        let data = number_to_tabular (current, watcher)
        updater_callback(name, data)
      }


      if(typeOf(watcher.transform) == 'function'){
        let data = watcher.transform(current, this, chart, __process_number_to_tabular)
        if(data)
          __process_number_to_tabular(data)
      }
      else{
        __process_number_to_tabular(current)
      }

      // data = number_to_tabular (current, watcher)


    }

    // updater_callback(name, data)

  }


}

/**
* @start
**/

let cache = undefined
let full = false
let require_path = ''
let ID = undefined

// const data_formater = function(data, format, require_path, cb){
//   debug('data_formater FUNC %s %o', format, data)
//   // process.exit(1)
//   if(format && data && (data.length > 0 || Object.getLength(data) > 0)){
//
//     if(format === 'merged'){
//       if(Array.isArray(data) && Array.isArray(data[0])){//array of array
//         // process.exit(1)
//         for(let i = 0; i < data.length; i++){
//           data[i] = merge_result_data(data[i])
//         }
//       }
//       else{
//         data = merge_result_data(data)
//       }
//
//       cb(data)
//     }
//     else{
//
//       // let stat = {}
//       // stat['data'] = (!Array.isArray(data)) ? [data] : data
//
//
//       data = (!Array.isArray(data)) ? [data] : data
//       /**
//       * data should be array of arrays (each array is a grouped path)
//       * when index=false is used, data isn't grouped, so we groupe it here
//       *
//       **/
//       if(!Array.isArray(data[0])){
//         // let tmp_data = []
//         let tmp_obj = {}
//         Array.each(data, function(value, key){
//           // tmp_data.push([value])
//           if(value && value.metadata && value.metadata.path){
//             if(!tmp_obj[value.metadata.path]) tmp_obj[value.metadata.path] = []
//             tmp_obj[value.metadata.path].push(value)
//           }
//         })
//
//         data = []
//         Object.each(tmp_obj, function(value){
//           data.push(value)
//         })
//       }
//
//       debug('FORMAT %o', data)
//       // process.exit(1)
//
//
//       // let stat_counter = 0
//       // let not_equal_length = true
//
//       let transformed = {}
//
//       eachOf(data, function (value, key, callback) {
//         key = (value[0] && value[0].metadata && value[0].metadata.path) ? value[0].metadata.path : key
//         let stat = {}
//         stat['data'] = value
//         __transform_data('stat', key, stat, undefined, require_path, function(value){
//           // transformed[key] = (value && value.stat) ? value.stat : undefined
//           transformed[key] = (value && value.stat && value.stat.data) ? value.stat.data : undefined
//           callback()
//         })
//       }.bind(this), function (err) {
//
//         data = transformed
//
//         debug('FORMAT trasnformed %O', transformed)
//         // process.exit(1)
//         // if( format == 'tabular' && !err && value.stat['data'] && (value.stat['data'].length > 0 || Object.getLength(value.stat['data']) > 0)){
//         // if( format == 'tabular' && data.length > 0){
//         if( format == 'tabular' && Object.getLength(data) > 0){
//           // let transformed = []
//           let transformed = {}
//
//           eachOf(data, function (value, key, callback) {
//             // debug_internals(': __transform_data tabular -> %o %s', value, key) //result
//             // process.exit(1)
//             // if(value && value.data && (value.data.length > 0 || Object.getLength(value.data))){
//             if(value && (value.length > 0 || Object.getLength(value))){
//               // let stat = {}
//               // stat['data'] = value
//
//               // __transform_data('tabular', 'data', value.data, id, function(value){
//               __transform_data('tabular', key, value, undefined, require_path, function(value){
//                 debug_internals(': __transform_data tabular -> %o', value) //result
//                 transformed[key] = value
//                 callback()
//               }.bind(this))
//             }
//             else{
//               // transformed[key] = undefined
//               callback()
//             }
//           }.bind(this), function(err){
//             data = transformed
//
//             cb(data)
//           }.bind(this))
//
//         }
//         else{
//
//           cb(data)
//         }
//
//       }.bind(this))
//
//
//     }
//
//
//   }
//   else{
//     cb(data)
//   }
// }

const data_formater = function(data, format, cb){
  // if(typeof full === 'function'){
  //   cb = full
  //   full = false
  // }
  // else {
  //   full = (full === true) ? full : false
  // }

  debug('data_formater FUNC %s %o %s', format, data, formater.require_path)
  // process.exit(1)

  if(format && data && (data.length > 0 || Object.getLength(data) > 0)){

    if(format === 'merged'){
      if(Array.isArray(data) && Array.isArray(data[0])){//array of array
        // process.exit(1)
        for(let i = 0; i < data.length; i++){
          data[i] = merge_result_data(data[i])
        }
      }
      else{
        data = merge_result_data(data)
      }

      cb(data)
    }
    else{

      // let stat = {}
      // stat['data'] = (!Array.isArray(data)) ? [data] : data


      data = (!Array.isArray(data)) ? [data] : data
      /**
      * data should be array of arrays (each array is a grouped path)
      * when index=false is used, data isn't grouped, so we groupe it here
      *
      **/
      if(!Array.isArray(data[0])){
        // let tmp_data = []
        let tmp_obj = {}
        Array.each(data, function(value, key){
          // tmp_data.push([value])
          if(value && value.metadata && value.metadata.path){
            if(!tmp_obj[value.metadata.path]) tmp_obj[value.metadata.path] = []
            tmp_obj[value.metadata.path].push(value)
          }
        })

        data = []
        Object.each(tmp_obj, function(value){
          data.push(value)
        })
      }

      debug('FORMAT %o', data)
      // process.exit(1)


      // let stat_counter = 0
      // let not_equal_length = true

      let transformed = {}

      eachOf(data, function (value, key, callback) {
        // debug('RESPONSES %s %o', key, value)
        // process.exit(1)

        key = (formater.full === false && value[0] && value[0].metadata && value[0].metadata.path) ? value[0].metadata.path : key

        let stat = {'data': undefined}
        stat['data'] = value

        if(formater.full === true){//includes metadata
          transformed[key] = {data: undefined, metadata: []}
          value.each(function(val){
            transformed[key]['metadata'].push(val.metadata)
          })
          transformed[key]['metadata'] = merge_result_data(transformed[key]['metadata'])
        }


        __transform_data('stat', key, stat, formater.ID, formater.require_path, function(value){
          // transformed[key] = (value && value.stat) ? value.stat : undefined
          if(formater.full === true){
            transformed[key].data = (value && value.stat && value.stat.data) ? value.stat.data : undefined
          }
          else{
            transformed[key] = (value && value.stat && value.stat.data) ? value.stat.data : undefined
          }
          // debug('RESPONSES %s %o', key, transformed[key])
          // process.exit(1)
          callback()
        })
      }.bind(this), function (err) {

        data = transformed

        debug('FORMAT transformed %O', data)
        // process.exit(1)
        // if( format == 'tabular' && !err && value.stat['data'] && (value.stat['data'].length > 0 || Object.getLength(value.stat['data']) > 0)){
        // if( format == 'tabular' && data.length > 0){
        if( format == 'tabular' && Object.getLength(data) > 0){
          // let transformed = []
          let transformed = {}

          // transformed[key].data = undefined

          eachOf(data, function (value, key, callback) {

            if(formater.full === true){
              transformed[key] = {data: undefined, metadata: data[key].metadata}
              value = value.data
            }

            // debug_internals(': __transform_data tabular -> %o %s', value, key) //result
            // process.exit(1)
            // if(value && value.data && (value.data.length > 0 || Object.getLength(value.data))){
            if(value && (value.length > 0 || Object.getLength(value))){
              // let stat = {}
              // stat['data'] = value

              // __transform_data('tabular', 'data', value.data, id, function(value){
              __transform_data('tabular', key, value, formater.ID, formater.require_path, function(value){
                debug_internals(': __transform_data tabular -> %o', value) //result
                // process.exit(1)
                if(formater.full === true){
                  transformed[key].data = value
                }
                else{
                  transformed[key] = value
                }

                callback()
              }.bind(this))
            }
            else{
              // transformed[key] = undefined
              callback()
            }
          }.bind(this), function(err){
            data = transformed

            cb(data)
          }.bind(this))

        }
        else{

          cb(data)
        }

      }.bind(this))


    }


  }
  else{
    cb(data)
  }
}

const __transform_data = function(type, data_path, data, cache_key, require_path, cb){
  debug_internals('__transform_data', type, data_path, data, require_path)
  // process.exit(1)
  let convert = (type == 'stat') ? data_to_stat : data_to_tabular

  let transformed = {}
  transformed[type] = {}

  let counter = 0 //counter for each path:stat in data
  // let instances = []
  let instances = {}

  if(!data || data == null && typeof cb == 'function')
    cb(transformed)

  /**
  * first count how many "transform" there are for this data set, so we can fire callback on last one
  **/
  let transform_result_length = 0
  Object.each(data, function(d, path){
    let transform = traverse_path_require(type, require_path, (data_path && data_path !== '') ? data_path+'.'+path : path, d)

    if(transform && typeof transform == 'function'){
      transform_result_length += Object.getLength(transform(d))
    }
    // else if(transform){
      transform_result_length++
    // }
  }.bind(this))

  let transform_result_counter = 0

  Object.each(data, function(d, path){

    debug_internals('DATA', d, type, path)

    if(d && d !== null){
      if (d[0] && d[0].metadata && d[0].metadata.format && d[0].metadata.format == type){

        // if(!d[0].metadata.format[type]){
        let formated_data = []
        Array.each(d, function(_d){ formated_data.push(_d.data) })
        transformed[type] = __merge_transformed(__transform_name(path), formated_data, transformed[type])
        // }

        if(counter == Object.getLength(data) - 1 && typeof cb == 'function')
          cb(transformed)

      }
      else if (
        (d[0] && d[0].metadata && !d[0].metadata.format && type == 'stat')
        || (d[0] && !d[0].metadata && type == 'tabular')
      ){
        let transform = traverse_path_require(type, require_path, (data_path && data_path !== '') ? data_path+'.'+path : path, d) //for each path find a transform or use "default"

        // debug_internals('__transform_data', d)
        if(transform){

          if(typeof transform == 'function'){
            let transform_result = transform(d, path)


            Object.each(transform_result, function(chart, path_key){

              /**
              * key may use "." to create more than one chart (per key), ex: cpus.times | cpus.percentage
              **/
              let sub_key = (path_key.indexOf('.') > -1) ? path_key.substring(0, path_key.indexOf('.')) : path_key


              if(type == 'tabular'){
                // debug_internals('transform_result', transform_result)

                let _wrap_convert = function(chart_instance){

                  convert(d[sub_key], chart_instance, path+'.'+path_key, function(name, stat){
                    transformed[type] = __merge_transformed(name, stat, transformed[type])
                    // name = name.replace(/\./g, '_')
                    // let to_merge = {}
                    // to_merge[name] = stat
                    //
                    // transformed = Object.merge(transformed, to_merge)
                    //
                    // debug_internals('chart_instance CACHE %o', name, transform_result_counter, transform_result_length)


                    // chart_instance = cache.clean(chart_instance)
                    // // debug_internals('transformed func', name, JSON.stringify(chart_instance))
                    // instances.push(__transform_name(path+'.'+path_key))
                    instances[__transform_name(path+'.'+path_key)] = chart_instance

                    /**
                    * race condition between this app && ui?
                    **/
                    // cache.set(cache_key+'.'+type+'.'+__transform_name(path+'.'+path_key), JSON.stringify(chart_instance), CHART_INSTANCE_TTL)

                    if(
                      transform_result_counter == transform_result_length - 1
                      && (counter >= Object.getLength(data) - 1 && typeof cb == 'function')
                    ){
                      /**
                      * race condition between this app && ui?
                      **/
                      // __save_instances(cache_key, instances, cb.pass(transformed[type]))
                      cb(transformed[type])
                    }

                    transform_result_counter++
                  }.bind(this))

                }
                if(formater.cache && cache_key){
                  formater.cache.get(cache_key+'.'+type+'.'+__transform_name(path+'.'+path_key), function(err, chart_instance){
                    // chart_instance = (chart_instance) ? JSON.parse(chart_instance) : chart
                    chart_instance = (chart_instance) ? chart_instance : chart

                    chart_instance = Object.merge(chart, chart_instance)

                    _wrap_convert(chart_instance)


                  }.bind(this))
                }
                else{
                  _wrap_convert(chart)
                }

              }
              else{
                convert(d[sub_key], chart, path+'.'+path_key, function(name, stat){
                  transformed[type] = __merge_transformed(name, stat, transformed[type])
                  // name = name.replace(/\./g, '_')
                  // let to_merge = {}
                  // to_merge[name] = stat
                  //
                  // debug_internals('transformed func', name, stat)
                  //
                  // transformed = Object.merge(transformed, to_merge)

                  if(
                    transform_result_counter == transform_result_length - 1
                    && (counter >= Object.getLength(data) - 1 && typeof cb == 'function')
                  ){
                    cb(transformed)
                  }


                  transform_result_counter++
                })

              }





            }.bind(this))
          }
          else{//not a function

            /**
            * @todo: 'tabular' not tested, also counter should consider this case (right now only considers functions type)
            **/
            if(type == 'tabular'){

              let _wrap_convert = function(chart_instance){
                convert(d, chart_instance, path, function(name, stat){
                  transformed[type] = __merge_transformed(name, stat, transformed[type])
                  // name = name.replace(/\./g, '_')
                  // let to_merge = {}
                  // to_merge[name] = stat
                  //
                  // debug_internals('transformed custom CACHE', cache_key+'.'+type+'.'+path, transformed)

                  // transformed = Object.merge(transformed, to_merge)

                  // chart_instance = cache.clean(chart_instance)

                  // instances.push(__transform_name(path))


                  instances[__transform_name(path)] = chart_instance
                  /**
                  * race condition between this app && ui?
                  **/
                  // cache.set(cache_key+'.'+type+'.'+__transform_name(path), JSON.stringify(chart_instance), CHART_INSTANCE_TTL)


                  if(
                    transform_result_counter == transform_result_length - 1
                    && (counter >= Object.getLength(data) - 1 && typeof cb == 'function')
                  ){
                    /**
                    * race condition between this app && ui?
                    **/
                    // __save_instances(cache_key, instances, cb.pass(transformed[type]))
                    cb(transformed[type])
                  }

                  transform_result_counter++

                }.bind(this))
              }

              if(formater.cache && cache_key){
                formater.cache.get(cache_key+'.'+type+'.'+__transform_name(path), function(err, chart_instance){
                  // chart_instance = (chart_instance) ? JSON.parse(chart_instance) : transform
                  chart_instance = (chart_instance) ? chart_instance : transform

                  chart_instance = Object.merge(chart_instance, transform)
                  // debug_internals('chart_instance NOT FUNC %o', chart_instance)

                  // debug_internals('transformed custom CACHE', cache_key+'.'+type+'.'+path)

                  // throw new Error()

                  _wrap_convert(chart_instance)


                }.bind(this))
              }
              else {
                _wrap_convert(transform)
              }
            }
            else{
              convert(d, transform, path, function(name, stat){
                transformed[type] = __merge_transformed(name, stat, transformed[type])

                // name = name.replace(/\./g, '_')
                // let to_merge = {}
                // to_merge[name] = stat
                //
                // debug_internals('transformed custom', type, to_merge)
                //
                // transformed = Object.merge(transformed, to_merge)

                if(counter == Object.getLength(data) - 1 && typeof cb == 'function')
                  cb(transformed)

              }.bind(this))
            }

          }


        }
        else{//default
          if(type == 'tabular'){ //default transform for "tabular"

            // debug_internals('transform default tabular', path)

            let chart = Object.clone(require(require_path+'/'+type)(d, path))

            let _wrap_convert = function(chart_instance){
              convert(d, chart_instance, path, function(name, stat){
                // debug_internals('transform default tabular %s %o', name, stat)
                // if(type !== 'stat')
                //   process.exit(1)

                /**
                * clean stats that couldn't be converted with "data_to_tabular"
                **/
                Array.each(stat, function(val, index){
                  Array.each(val, function(row, i_row){
                    if(isNaN(row) && typeof row !== 'string')
                      val[i_row] = undefined
                  })
                  stat[index] = val.clean()
                  if(stat[index].length <= 1)
                    stat[index] = undefined
                })
                stat = stat.clean()

                // debug_internals('transform default tabular', name, stat)

                if(stat.length > 0)
                  transformed[type] = __merge_transformed(name, stat, transformed[type])


                // name = name.replace(/\./g, '_')
                // let to_merge = {}
                // to_merge[name] = stat
                //
                // transformed = Object.merge(transformed, to_merge)
                // debug_internals('default chart_instance CACHE %o', name)

                // debug_internals('default chart_instance CACHE %o', name, transform_result_counter, transform_result_length)
                // chart_instance = cache.clean(chart_instance)
                // // debug_internals('transformed func', name, JSON.stringify(chart_instance))
                // instances.push(__transform_name(path))
                instances[__transform_name(path)] = chart_instance

                /**
                * race condition between this app && ui?
                **/
                // formater.cache.set(cache_key+'.'+type+'.'+__transform_name(path), JSON.stringify(chart_instance), CHART_INSTANCE_TTL)

                debug_internals('transform default tabular %d', transform_result_counter, transform_result_length, counter, Object.getLength(data), typeof cb == 'function', (
                  transform_result_counter == transform_result_length - 1
                  && (counter >= Object.getLength(data) - 1 && typeof cb == 'function')
                ))
                if(
                  transform_result_counter == transform_result_length - 1
                  && (counter >= Object.getLength(data) - 1 && typeof cb == 'function')
                ){

                  /**
                  * race condition between this app && ui?
                  **/
                  // __save_instances(cache_key, instances, cb.pass(transformed[type]))
                  cb(transformed[type])
                }

                transform_result_counter++
              }.bind(this))
            }

            if(formater.cache && cache_key){
              formater.cache.get(cache_key+'.'+type+'.'+__transform_name(path), function(err, chart_instance){
                // chart_instance = (chart_instance) ? JSON.parse(chart_instance) : chart
                chart_instance = (chart_instance) ? chart_instance : chart

                chart_instance = Object.merge(chart, chart_instance)

                // debug_internals('transform default tabular', d, path)

                _wrap_convert(chart_instance)

              }.bind(this))
            }
            else{
              _wrap_convert(chart)
            }
          }
          else{//default transform for "stat"
            require(require_path+'/'+type)(d, path, function(name, stat){
              // debug_internals('transform default', d, path, name , stat)
              // process.exit(1)
              transformed[type] = __merge_transformed(name, stat, transformed[type])
              // name = name.replace(/\./g, '_')
              // let to_merge = {}
              // to_merge[name] = stat
              // debug_internals('transformed default', type, to_merge)
              // transformed = Object.merge(transformed, to_merge)

              // debug_internals('transform default', d, path)
              // process.exit(1)

              if(counter == Object.getLength(data) - 1 && typeof cb == 'function')
                cb(transformed)

            }.bind(this))
          }


        }

        // if(counter == Object.getLength(data) - 1 && typeof cb == 'function')
        //   cb(transformed)

      }
      else if(counter == Object.getLength(data) - 1 && typeof cb == 'function'){
          cb(transformed)
      }

    }//end if(d && d !== null)
    else if(counter == Object.getLength(data) - 1 && typeof cb == 'function'){
        cb(transformed)
    }

    counter++
  }.bind(this))


}

// const merge_result_data = function(data){
//   debug('merge_result_data')
//   let newData
//   if(Array.isArray(data)){
//     debug('merge_result_data TO MERGE ARRAY', data)
//     newData = data.shift()
//
//     for(const i in data){
//       newData = deep_object_merge(newData, data[i])
//     }
//   }
//   else if(typeof data === 'object' && data.constructor === Object && Object.keys(data).length > 0){
//     newData = {}
//     // debug('merge_result_data TO MERGE', data)
//     for(const i in data){
//       debug('merge_result_data TO MERGE', i, data[i])
//       newData[i] = merge_result_data(data[i])
//     }
//   }
//   else{
//     newData = data
//   }
//
//   debug('merge_result_data MERGED', newData)
//
//   return newData
// }

const merge_result_data = function(data){
  debug('merge_result_data', data)

  let newData
  if(Array.isArray(data)){
    debug('merge_result_data TO MERGE ARRAY', data)
    // process.exit(1)
    let first = data.shift()
    if(first.data && first.metadata){
      newData = {}
      newData[first.metadata.path] = first.data
    }
    else{
      newData = first

    }

    for(const i in data){
      newData = deep_object_merge(newData, data[i])
    }

  }
  else if(typeof data === 'object' && data.constructor === Object && Object.keys(data).length > 0){
    newData = {}
    // debug('merge_result_data TO MERGE', data)
    for(const i in data){
      debug('merge_result_data TO MERGE', i, data[i])
      newData[i] = merge_result_data(data[i])
    }
  }
  else{
    newData = data
  }

  debug('merge_result_data MERGED', newData)

  return newData
}

// const deep_object_merge = function(obj1, obj2){
//   // debug('deep_object_merge %o %o', obj1, obj2)
//
//   let merged = (obj1) ?  Object.clone(obj1): {}
//
//   for(const key in obj2){
//     if(!obj1[key]){
//       obj1[key] = obj2[key]
//     }
//     else if(obj2[key] !== null && obj1[key] !== obj2[key]){
//       if(typeof obj2[key] === 'object' && obj2[key].constructor === Object && Object.keys(obj2[key]).length > 0){
//         merged[key] = deep_object_merge(merged[key], obj2[key])
//
//         // if(Object.keys(merged).length === 0)
//         //   delete merged[key]
//
//       }
//       else if(Array.isArray(merged[key]) && Array.isArray(obj2[key])){
//         merged[key].combine(obj2[key])
//       }
//       // else if( Object.keys(obj2[key]).length > 0 ){
//       else {
//         if(!Array.isArray(merged[key])){
//           let tmpVal = merged[key]
//           merged[key] = []
//         }
//
//         merged[key].include(obj2[key])
//       }
//
//     }
//
//
//   }
//
//
//   return merged
// }

const deep_object_merge = function(obj1, obj2){
  debug('deep_object_merge %o %o', obj1, obj2)
  // process.exit(1)

  let merged = (obj1) ?  Object.clone(obj1): {}
  // let merged = (obj1) ?  obj1 : {}

  if(obj2.data && obj2.metadata){
    if(!merged[obj2.metadata.path]){
      merged[obj2.metadata.path] = obj2.data

    }

    merged[obj2.metadata.path] = deep_object_merge(merged[obj2.metadata.path], obj2.data)

  }
  else{
    for(const key in obj2){
      if(!obj1[key]){
        obj1[key] = obj2[key]
      }
      else if(obj2[key] !== null && obj1[key] !== obj2[key]){
        if(typeof obj2[key] === 'object' && obj2[key].constructor === Object && Object.keys(obj2[key]).length > 0){
          merged[key] = deep_object_merge(merged[key], obj2[key])

          // if(Object.keys(merged).length === 0)
          //   delete merged[key]

        }
        else if(Array.isArray(merged[key]) && Array.isArray(obj2[key])){
          merged[key].combine(obj2[key])
        }
        // else if( Object.keys(obj2[key]).length > 0 ){
        else {
          if(!Array.isArray(merged[key])){
            let tmpVal = merged[key]
            merged[key] = []
          }

          merged[key].include(obj2[key])
        }

      }


    }
  }




  return merged
}

let __traversed_path_require = {}

const traverse_path_require = function(type, require_path, path, stat, original_path){
  original_path = original_path || path
  path = path.replace(/_/g, '.')
  original_path = original_path.replace(/_/g, '.')


  if(__traversed_path_require[require_path+'/'+type+'/'+path] && __traversed_path_require[require_path+'/'+type+'/'+path] !== undefined){
    return __traversed_path_require[require_path+'/'+type+'/'+path]
  }
  else if(__traversed_path_require[require_path+'/'+type+'/'+path] === undefined){
    if(path.indexOf('.') > -1){
      let pre_path = path.substring(0, path.lastIndexOf('.'))
      if(__traversed_path_require[require_path+'/'+type+'/'+pre_path] !== undefined){
        let chart = traverse_path_require(type, pre_path, stat, original_path)
        __traversed_path_require[require_path+'/'+type+'/'+pre_path] = chart
        return chart
      }
    }
    return undefined
  }
  else{

    debug_internals('traverse_path_require %s',  require_path+'/'+type+'/'+path)

    try{
      let chart = require(require_path+'/'+type+'/'+path)(stat, original_path)
      __traversed_path_require[require_path+'/'+type+'/'+path] = chart
      return chart
    }
    catch(e){
      __traversed_path_require[require_path+'/'+type+'/'+path] = undefined
      if(path.indexOf('.') > -1){
        let pre_path = path.substring(0, path.lastIndexOf('.'))
        let chart = traverse_path_require(type, require_path, pre_path, stat, original_path)
        __traversed_path_require[require_path+'/'+type+'/'+pre_path] = chart
        return chart
      }

      return undefined
    }

  }


  // let path = path.split('.')
  // if(!Array.isArray(path))
  //   path = [path]
  //
  // Array.each()
}

const __merge_transformed = function(name, stat, merge){
  name = __transform_name(name)

  let to_merge = {}
  to_merge[name] = stat
  return Object.merge(merge, to_merge)
}

const __transform_name = function(name){
  name = name.replace(/\./g, '_')
  name = name.replace(/\%/g, 'percentage_')
  return name
}

const formater = module.exports = data_formater
formater.full = full
formater.require_path = require_path
formater.cache = cache
formater.ID = ID

formater.traverse_path_require = traverse_path_require
formater.data_to_stat = data_to_stat
formater.data_to_tabular = data_to_tabular
formater.array_to_tabular = array_to_tabular
formater.number_to_tabular = number_to_tabular
formater.nested_array_to_tabular = nested_array_to_tabular
/**
* from mixin/chart.vue
**/
formater.flattenObject = flattenObject

/**
* @end
**/
// module.exports {
//   traverse_path_require: traverse_path_require,
// 	/**
// 	* from mixins/dashboard.vue
// 	**/
// 	get_dynamics: function (name, dynamics){
// 		let tabulars = {}
// 		Object.each(dynamics, function(dynamic){
// 			if(dynamic.match.test(name) == true){
// 				if(!tabulars[name])
// 					tabulars[name] = []
//
// 				tabulars[name].push(dynamic)
//
// 			}
// 		}.bind(this))
//
// 		return tabulars
// 	},
// 	/**
// 	* from mixins/dashboard.vue
// 	**/
//
//   data_to_stat: function(current, chart, name, updater_callback){
//     let watcher = chart.watch || {}
//
// 		if(watcher.managed == true){
// 			watcher.transform(current, this, chart, updater_callback)
// 		}
// 		else{
// 			let type_value = undefined
// 			let value_length = 0
// 			let watcher_value = watcher.value
//
// 			if(watcher.value && watcher.value != ''){
//
// 				if(Array.isArray(watcher.value)){
// 					if(!(watcher.value[0] instanceof RegExp)){
// 						// Object.each(stat[0].value, function(val, key){
// 						// 	/**
// 						// 	* watch out to have a good RegExp, or may keep matching keeps 'til last one
// 						// 	**/
// 						// 	if(chart.watch.value[0].test(key))
// 						// 		obj = stat[0].value[key]
// 						// })
// 						watcher_value = watcher.value[0]
// 						type_value = (Array.isArray(current[0].data) && current[0].data[0][watcher_value]) ? current[0].value[0][watcher_value] : current[0].data[watcher_value]
// 					}
// 					else{//RegExp
// 						if(Array.isArray(current[0].data)){
// 							Object.each(current[0].data[0], function(val, key){
// 								if(watcher.value[0].test(key))
// 									type_value = current[0].data[0][key]
// 							})
// 						}
// 						else{
// 							Object.each(current[0].data, function(val, key){
// 								if(watcher.value[0].test(key))
// 									type_value = current[0].data[key]
// 							})
//
//
// 						}
//
// 					}
//
// 				}
//         else{
//           type_value = (Array.isArray(current[0].data) && current[0].data[0][watcher_value]) ? current[0].data[0][watcher_value] : current[0].data[watcher_value]
//         }
//
// 			}
// 			else if(current[0] && (current[0].data || !isNaN(current[0].data))){
// 				type_value = current[0].data
// 			}
//
// 			let data = []
//
//       // if(watcher && watcher.transform)
//       //   console.log('WATCHER', typeof watcher.transform)
//
//
//       // if(type_value && Array.isArray(type_value)){//multiple values, ex: loadavg
//
//         debug_internals('data_to_stat',type_value )
//
// 				if(watcher.exclude){
// 					Array.each(current, function(data){
// 						Object.each(data.data, function(value, key){
// 							if(watcher.exclude.test(key) == true)
// 								delete data.data[key]
// 						})
// 					})
// 				}
//
//         // let __process_array_to_tabular = function(current){
//         //   let data = array_to_tabular(current, watcher)
//         //   updater_callback(name, data)
//         // }
//
//
// 				if(typeOf(watcher.transform) == 'function'){
// 					// current = watcher.transform(current, this, chart)
//           let data = watcher.transform(current, this, chart, data => updater_callback(name, data))
//           // // if(data && ! /function/.test(data))
//           // if(data)
//           //   __process_array_to_tabular(data)
//
// 				}
//         else{
//           // __process_array_to_tabular(current)
//         }
//
//
// 		// 	}
// 		// 	else if(
//     //     type_value
// 		// 		&& (isNaN(type_value) || watcher.value != '')
// 		// 		&& !(
// 		// 			!Array.isArray(current[0].data)
// 		// 			&&
// 		// 			(
// 		// 				watcher_value
// 		// 				&& isNaN(current[0].data[watcher_value])
// 		// 			)
// 		// 		)
// 		// 	){
//     //
//     //     if(Array.isArray(current[0].data) && current[0].data[0][watcher.value]){//cpus
// 		// 			current = nested_array_to_tabular(current, watcher, name)
// 		// 		}
//     //
//     //     // else{//blockdevices.sdX
// 		// 		if(watcher.exclude){
// 		// 			Array.each(current, function(data){
// 		// 				Object.each(data.data, function(value, key){
// 		// 					if(watcher.exclude.test(key) == true)
// 		// 						delete data.data[key]
// 		// 				})
// 		// 			})
// 		// 		}
//     //
//     //     let __process_array_to_tabular = function(current){
//     //       if(!Array.isArray(current))
//     //         current = [current]
//     //
//     //       // console.log('current, watcher', current, watcher)
//     //
//     //       let data = array_to_tabular(current, watcher)
//     //       updater_callback(name, data)
//     //     }
//     //
// 		// 		if(typeOf(watcher.transform) == 'function'){
// 		// 			// current = watcher.transform(current, this, chart)
//     //       let data = watcher.transform(current, this, chart, __process_array_to_tabular)
//     //       // console.log('DATA', data, typeof data)
//     //
//     //       // if(data && ! /function/.test(data))
//     //       if(data)
//     //         __process_array_to_tabular(data)
// 		// 		}
//     //     else{
//     //       __process_array_to_tabular(current)
//     //     }
//     //
// 		// 		// if(!Array.isArray(current))
// 		// 		// 	current = [current]
//     //     //
// 		// 		// data = array_to_tabular(current, watcher)
//     //
// 		// 	}
// 		// 	else if(
//     //     type_value
// 		// 		&& (isNaN(type_value) || watcher_value != '')
// 		// 		&& (
// 		// 			!Array.isArray(current[0].data)
// 		// 			&&
// 		// 			(
// 		// 				watcher_value
// 		// 				&& isNaN(current[0].data[watcher_value])
// 		// 			)
// 		// 		)
// 		// 	){//like os.minute.cpus
//     //
//     //
//     //
// 		// 		current = nested_object_to_tabular(current, watcher, name)
//     //
//     //
// 		// 		if(watcher.exclude){
// 		// 			Array.each(current, function(data){
//     //         let obj = undefined
//     //         if(data.data[watcher_value]){
//     //           obj = data.data[watcher_value]
//     //         }
//     //         else{
//     //           obj = data.data
//     //         }
//     //
// 		// 				Object.each(obj, function(value, key){
// 		// 					if(watcher.exclude.test(key) == true)
// 		// 						delete obj[key]
// 		// 				})
// 		// 			})
// 		// 		}
//     //
//     //
//     //     let __process_array_to_tabular = function(current){
//     //       let data = array_to_tabular(current, watcher)
//     //       updater_callback(name, data)
//     //     }
//     //
// 		// 		if(typeOf(watcher.transform) == 'function'){
// 		// 			let data = watcher.transform(current, this, chart, __process_array_to_tabular)
//     //
//     //       // if(data && ! /function/.test(data))
//     //       if(data)
//     //         __process_array_to_tabular(data)
// 		// 		}
//     //     else{
//     //       __process_array_to_tabular(current)
//     //     }
//     //
// 		// 		// data = array_to_tabular(current, watcher)
//     //
// 		// 	}
// 		// 	else if(type_value || !isNaN(type_value)){//single value, ex: uptime
//     //     // console.log('data_to_tabular', name, type_value)
//     //
//     //     let __process_number_to_tabular = function(current){
//     //       let data = number_to_tabular (current, watcher)
//     //       updater_callback(name, data)
//     //     }
//     //
//     //
// 		// 		if(typeOf(watcher.transform) == 'function'){
// 		// 			let data = watcher.transform(current, this, chart, __process_number_to_tabular)
//     //       if(data)
//     //         __process_number_to_tabular(data)
// 		// 		}
//     //     else{
//     //       __process_number_to_tabular(current)
//     //     }
//     //
// 		// 		// data = number_to_tabular (current, watcher)
//     //
//     //
// 		// 	}
//     //
// 		// 	// updater_callback(name, data)
//     //
// 		}
//
//
// 	},
//
// 	/**
// 	* from mixin/chart.vue
// 	**/
// 	/**
// 	 * ex-generic_data_watcher->data_to_tabular
// 	 * */
// 	data_to_tabular: function(current, chart, name, updater_callback){
//     let watcher = chart.watch || {}
//
// 		if(watcher.managed == true){
// 			watcher.transform(current, this, chart, updater_callback)
// 		}
// 		else{
// 			let type_value = undefined
// 			let value_length = 0
// 			let watcher_value = watcher.value
//
// 			if(watcher.value && watcher.value != ''){
//
// 				if(Array.isArray(watcher.value)){
// 					if(!(watcher.value[0] instanceof RegExp)){
// 						// Object.each(stat[0].value, function(val, key){
// 						// 	/**
// 						// 	* watch out to have a good RegExp, or may keep matching keeps 'til last one
// 						// 	**/
// 						// 	if(chart.watch.value[0].test(key))
// 						// 		obj = stat[0].value[key]
// 						// })
// 						watcher_value = watcher.value[0]
// 						type_value = (Array.isArray(current[0].value) && current[0].value[0][watcher_value]) ? current[0].value[0][watcher_value] : current[0].value[watcher_value]
// 					}
// 					else{//RegExp
// 						if(Array.isArray(current[0].value)){
// 							Object.each(current[0].value[0], function(val, key){
// 								if(watcher.value[0].test(key))
// 									type_value = current[0].value[0][key]
// 							})
// 						}
// 						else{
// 							Object.each(current[0].value, function(val, key){
// 								if(watcher.value[0].test(key))
// 									type_value = current[0].value[key]
// 							})
//
//
// 						}
//
// 					}
//
// 				}
//         else{
//           type_value = (Array.isArray(current[0].value) && current[0].value[0][watcher_value]) ? current[0].value[0][watcher_value] : current[0].value[watcher_value]
//         }
//
// 			}
// 			else if(current[0] && (current[0].value || !isNaN(current[0].value))){
// 				type_value = current[0].value
// 			}
//
// 			let data = []
//
//       // if(watcher && watcher.transform)
//       //   console.log('WATCHER', typeof watcher.transform)
//
//
//       if(type_value && Array.isArray(type_value)){//multiple values, ex: loadavg
//
// 				if(watcher.exclude){
// 					Array.each(current, function(data){
// 						Object.each(data.value, function(value, key){
// 							if(watcher.exclude.test(key) == true)
// 								delete data.value[key]
// 						})
// 					})
// 				}
//
//         let __process_array_to_tabular = function(current){
//           let data = array_to_tabular(current, watcher)
//           updater_callback(name, data)
//         }
//
//
// 				if(typeOf(watcher.transform) == 'function'){
// 					// current = watcher.transform(current, this, chart)
//           let data = watcher.transform(current, this, chart, __process_array_to_tabular)
//           // if(data && ! /function/.test(data))
//           if(data)
//             __process_array_to_tabular(data)
//
// 				}
//         else{
//           // data = array_to_tabular(current, watcher)
//           __process_array_to_tabular(current)
//         }
//
//
// 			}
// 			else if(
//         type_value
// 				&& (isNaN(type_value) || watcher.value != '')
// 				&& !(
// 					!Array.isArray(current[0].value)
// 					&&
// 					(
// 						watcher_value
// 						&& isNaN(current[0].value[watcher_value])
// 					)
// 				)
// 			){
//
//         if(Array.isArray(current[0].value) && current[0].value[0][watcher.value]){//cpus
// 					current = nested_array_to_tabular(current, watcher, name)
// 				}
//
//         // else{//blockdevices.sdX
// 				if(watcher.exclude){
// 					Array.each(current, function(data){
// 						Object.each(data.value, function(value, key){
// 							if(watcher.exclude.test(key) == true)
// 								delete data.value[key]
// 						})
// 					})
// 				}
//
//         let __process_array_to_tabular = function(current){
//           if(!Array.isArray(current))
//             current = [current]
//
//           // console.log('current, watcher', current, watcher)
//
//           let data = array_to_tabular(current, watcher)
//           debug_internals('data_to_tabular ', type_value, typeOf(type_value), current[0].value, data)
//           updater_callback(name, data)
//         }
//
// 				if(typeOf(watcher.transform) == 'function'){
// 					// current = watcher.transform(current, this, chart)
//           let data = watcher.transform(current, this, chart, __process_array_to_tabular)
//           // console.log('DATA', data, typeof data)
//
//           // if(data && ! /function/.test(data))
//           if(data)
//             __process_array_to_tabular(data)
// 				}
//         else{
//           __process_array_to_tabular(current)
//         }
//
//
// 				// if(!Array.isArray(current))
// 				// 	current = [current]
//         //
// 				// data = array_to_tabular(current, watcher)
//
// 			}
// 			else if(
//         type_value
// 				&& (isNaN(type_value) || watcher_value != '')
// 				&& (
// 					!Array.isArray(current[0].value)
// 					&&
// 					(
// 						watcher_value
// 						&& isNaN(current[0].value[watcher_value])
// 					)
// 				)
// 			){//like os.minute.cpus
//
//
//
// 				current = nested_object_to_tabular(current, watcher, name)
//
//
// 				if(watcher.exclude){
// 					Array.each(current, function(data){
//             let obj = undefined
//             if(data.value[watcher_value]){
//               obj = data.value[watcher_value]
//             }
//             else{
//               obj = data.value
//             }
//
// 						Object.each(obj, function(value, key){
// 							if(watcher.exclude.test(key) == true)
// 								delete obj[key]
// 						})
// 					})
// 				}
//
//
//         let __process_array_to_tabular = function(current){
//           let data = array_to_tabular(current, watcher)
//           updater_callback(name, data)
//         }
//
// 				if(typeOf(watcher.transform) == 'function'){
// 					let data = watcher.transform(current, this, chart, __process_array_to_tabular)
//
//           // if(data && ! /function/.test(data))
//           if(data)
//             __process_array_to_tabular(data)
// 				}
//         else{
//           __process_array_to_tabular(current)
//         }
//
// 				// data = array_to_tabular(current, watcher)
//
// 			}
// 			else if(type_value || !isNaN(type_value)){//single value, ex: uptime
//         // console.log('data_to_tabular', name, type_value)
//
//         let __process_number_to_tabular = function(current){
//           let data = number_to_tabular (current, watcher)
//           updater_callback(name, data)
//         }
//
//
// 				if(typeOf(watcher.transform) == 'function'){
// 					let data = watcher.transform(current, this, chart, __process_number_to_tabular)
//           if(data)
//             __process_number_to_tabular(data)
// 				}
//         else{
//           __process_number_to_tabular(current)
//         }
//
// 				// data = number_to_tabular (current, watcher)
//
//
// 			}
//
// 			// updater_callback(name, data)
//
// 		}
//
//
// 	},
//
// 	array_to_tabular: array_to_tabular,
//
// 	number_to_tabular: number_to_tabular,
//
// 	nested_array_to_tabular: nested_array_to_tabular,
//
// 	/**
// 	* from mixin/chart.vue
// 	**/
// 	flattenObject: flattenObject
// }
