var array_to_tabular = function (current, watcher){
	watcher = watcher || {value: ''}
	watcher.value = watcher.value || ''

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

var nested_array_to_tabular = function (current, watcher, name){

	let index = (name.substring(name.indexOf('_') +1 , name.length - 1)) * 1
	////////////////console.log('generic_data_watcher isNanN', name, val, index)

	let val_current = []
	Array.each(current, function(item){
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

	}.bind(this))

	// ////////////////console.log('CPU new current', val_current)

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
		let watcher = chart.watch || {}

		if(watcher.managed == true){
			watcher.transform(current, this, chart)
		}
		else{
			let type_value = null
			let value_length = 0
			if(watcher.value != ''){
				type_value = (Array.isArray(current[0].value) && current[0].value[0][watcher.value]) ? current[0].value[0][watcher.value] : current[0].value[watcher.value]
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
			else if(isNaN(type_value) || watcher.value != ''){

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
