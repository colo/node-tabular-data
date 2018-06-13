module.exports = {
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
	}
}
