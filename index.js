var _process_array_watcher_value = function(value, watcher_value, key){
	let data = {key: null, value: null}
	let _watcher_value = Array.clone(watcher_value)

	Array.each(watcher_value, function(sub_key, index){

		if(sub_key instanceof RegExp){
			Object.each(value, function(val, new_key){
				if(sub_key.test(new_key)){

					if(!key){
						data['key'] = new_key
					}
					else{
						data['key'] = key+'.'+new_key
					}

					if(index == watcher_value.length - 1){//last watcher_value
						data['value'] = value[new_key]
					}
					else{
						_watcher_value.shift()
		      	data =  _process_array_watcher_value (value[new_key], _watcher_value, data['key'])

					}

				}

			})


		}
		else{
			if(!key){
				data['key'] = sub_key
			}
			else{
				data['key'] = key+'.'+sub_key
			}

			if(index == watcher_value.length - 1){//last watcher_value
				data['value'] = value[sub_key]

				// console.log(value)

			}
			else{
				_watcher_value.shift()
      	data =  _process_array_watcher_value (value[sub_key], _watcher_value, data['key'])

			}
		}
		console.log('key', data['key'])
	})

	console.log('DATA', data)
	return data
}

var nested_object_to_tabular = function (current, watcher){
	watcher = watcher || {value: ''}
	watcher.value = watcher.value || ''


	let data = []
	Array.each(current, function(item){
		let tmp_data = {}
		tmp_data.timestamp = new Date(item.timestamp)
		// tmp_data.push(new Date(item.timestamp))

		let value = null

		if(watcher.value != ''){

			if(Array.isArray(watcher.value)){
				let tmp_value = _process_array_watcher_value(item.value, watcher.value)

				console.log('TMP VALUE', tmp_value)
				// value = item.value

				// Array.each(watcher.value, function(sub_key, index){
				//   if(sub_key instanceof RegExp){
        //
				// 		if(Array.isArray(value)){
				// 			let tmp_value = Array.clone(value)
				// 			value = []
				// 			Array.each(tmp_value, function(val){
        //
				// 				Object.each(val, function(sub_val, key){
				// 					if(sub_key.test(key)){
				// 						value.push(sub_val)
				// 					}
				// 				})
        //
				// 			})
				// 		}
				// 		else{
				// 			let tmp_value = Object.clone(value)
				// 			value = []
				// 			Object.each(tmp_value, function(val, key){
				// 				if(sub_key.test(key)){
				// 					// value.push(val)
				// 					value.push(tmp_value)
				// 				}
				// 			})
				// 		}
        //
				// 	}
				// 	else{
				// 		if(Array.isArray(value)){
				// 			tmp_value = Array.clone(value)
				// 			value = []
				// 			Array.each(tmp_value, function(val){
				// 				// //console.log('ARRAY', val)
				// 				let tmp_obj = {}
				// 				tmp_obj[sub_key] = val[sub_key]
				// 				value.push(tmp_obj)
				// 			})
				// 		}
				// 		else{
				// 	 		value = value[sub_key]
				// 		}
        //
				// 	}
        //
				// })

				// if(watcher.value[0] instanceof RegExp){
				// 	Object.each(stat[0].value, function(val, key){
				// 		/**
				// 		* watch out to have a good RegExp, or may keep matching keeps 'til last one
				// 		**/
				// 		if(chart.watch.value[0].test(key))
				// 			obj = stat[0].value[key]
				// 	})
				// }
				// else{
				// 	obj = stat[0].value[chart.watch.value[0]]
				// }

			}
			else{
				value[watcher.value] = item.value[watcher.value]
			}


		}
		else{
			value = item.value
		}

		tmp_data.value = value



		// // Array.each(value, function(real_value){
		// //   tmp_data.push(real_value)
		// // })
		// if(Array.isArray(value)){
		// 	Array.each(value, function(real_value){
		// 		tmp_data.push(real_value)
		// 	})
		// }
		// else if(!isNaN(value)){//mounts[mount_point].value.percentage
		// 	tmp_data.push(value * 1)
		// }
		// else if(!value){//mounts[mount_point].value.percentage
		// 	//this is an error?
		// }
		// else{
		// 	Object.each(value, function(real_value, key){
    //
    //
		// 		real_value = real_value * 1
		// 		tmp_data.value = (real_value)
		// 	})
		// }

		// tmp_data.push(0)//add minute column

		data.push(tmp_data)
	})

	console.log('nested_object_to_tabular')
	console.log(data)

	return data
}

var array_to_tabular = function (current, watcher){
	watcher = watcher || {value: ''}
	watcher.value = watcher.value || ''

	// //console.log('array_to_tabular', current, watcher)

	let data = []
	Array.each(current, function(item){
		let tmp_data = []
		tmp_data.push(new Date(item.timestamp))

		let value = null

		if(watcher.value != ''){
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
	})

	return data
}

var number_to_tabular = function(current, watcher){
	let data = []
	Array.each(current, function(current){
		let value = null
		if(watcher.value != ''){
			value = current.value[watcher.value]
		}
		else{
			value = current.value
		}

		// data.push([new Date(current.timestamp), value, 0])//0, minute column
		data.push([new Date(current.timestamp), value])//0, minute column
	})

	return data
}

/**
* @todo: change name nested_array_to_tabular -> nested_array_to_array
**/
var nested_array_to_tabular = function (current, watcher, name){

	let index = (name.substring(name.indexOf('_') +1 , name.length - 1)) * 1
	//////////////////console.log('generic_data_watcher isNanN', name, val, index)

	let val_current = []
	Array.each(current, function(item){
		// //////////////////console.log('CPU item', item)

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

	}.bind(this))

	// //////////////////console.log('CPU new current', val_current)

	return val_current
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
		// //console.log('data_to_tabular', name)

		let watcher = chart.watch || {}

		if(watcher.managed == true){
			watcher.transform(current, this, chart)
		}
		else{
			let type_value = null
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

			}
			else{
				type_value = current[0].value
			}

			let data = []

			if(Array.isArray(type_value)){//multiple values, ex: loadavg
				if(watcher.exclude){
					Array.each(current, function(data){
						Object.each(data.value, function(value, key){
							if(watcher.exclude.test(key) == true)
								delete data.value[key]
						})
					})
				}

				if(typeOf(watcher.transform) == 'function'){
					current = watcher.transform(current, this, chart)
				}

				data = array_to_tabular(current, watcher)
			}
			else if(
				(isNaN(type_value) || watcher_value != '')
				&& (Array.isArray(current[0].value) && current[0].value[0][watcher_value])
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


				if(typeOf(watcher.transform) == 'function'){
					current = watcher.transform(current, this, chart)
				}

				if(!Array.isArray(current))
					current = [current]

				data = array_to_tabular(current, watcher)
				// console.log('AFTER array_to_tabular', data)
			}
			else if(
				(isNaN(type_value) || watcher_value != '')
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
						Object.each(data.value, function(value, key){
							if(watcher.exclude.test(key) == true)
								delete data.value[key]
						})
					})
				}

				if(typeOf(watcher.transform) == 'function'){
					current = watcher.transform(current, this, chart)
				}

				data = array_to_tabular(current, watcher)
			}
			else{//single value, ex: uptime

				if(typeOf(watcher.transform) == 'function'){
					current = watcher.transform(current, this, chart)
				}

				data = number_to_tabular (current, watcher)


			}

			updater_callback(name, data)

		}


	},

	array_to_tabular: array_to_tabular,

	number_to_tabular: number_to_tabular,

	nested_array_to_tabular: nested_array_to_tabular,

	/**
	* from mixin/chart.vue
	**/
}
