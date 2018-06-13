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
	array_to_tabular: function (current, watcher){
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
	},
	number_to_tabular: function(current, watcher){
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
	},
	
	nested_array_to_tabular: function (current, watcher, name){

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
	
	/**
	* from mixin/chart.vue
	**/
}
