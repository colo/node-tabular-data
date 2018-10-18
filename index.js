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
		if(watcher.value != '' && !Array.isArray(watcher.value)){
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

module.exports = {
	/**
	* from mixins/dashboard.vue
	**/
	get_dynamics: function (name, dynamics){
		let tabulars = {}
		Object.each(dynamics, function(dynamic){
			if(dynamic.match.test(name) == true){
				if(!tabulars[name])
					tabulars[name] = []

				tabulars[name].push(dynamic)

			}
		}.bind(this))

		return tabulars
	},
	/**
	* from mixins/dashboard.vue
	**/

	/**
	* from mixin/chart.vue
	**/
	/**
	 * ex-generic_data_watcher->data_to_tabular
	 * */
	data_to_tabular: function(current, chart, name, updater_callback){
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
			else if(current[0] && current[0].value){
				type_value = current[0].value
			}

			let data = []

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

          let data = array_to_tabular(current, watcher)
          updater_callback(name, data)
        }

				if(typeOf(watcher.transform) == 'function'){
					// current = watcher.transform(current, this, chart)
          let data = watcher.transform(current, this, chart, __process_array_to_tabular)
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
          if(data)
            __process_array_to_tabular(data)
				}
        else{
          __process_array_to_tabular(current)
        }

				// data = array_to_tabular(current, watcher)

			}
			else if(type_value){//single value, ex: uptime
        // console.log('data_to_tabular', name, type_value)

        let __process_number_to_tabular = function(current){
          let data = number_to_tabular (current, watcher)
          updater_callback(name, data)
        }


				if(typeOf(watcher.transform) == 'function'){
					let data = watcher.transform(current, this, chart, __process_number_to_tabular)
          if(data)
            __process_array_to_tabular(data)
				}
        else{
          __process_number_to_tabular(current)
        }

				// data = number_to_tabular (current, watcher)


			}

			// updater_callback(name, data)

		}


	},

	array_to_tabular: array_to_tabular,

	number_to_tabular: number_to_tabular,

	nested_array_to_tabular: nested_array_to_tabular,

	/**
	* from mixin/chart.vue
	**/
	flattenObject: flattenObject
}
