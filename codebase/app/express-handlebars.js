var Handlebars = require('handlebars'),
	Fs = require('fs'),
	Path = require('path'),
	_ = require('lodash');

Handlebars.registerHelper('partial', function(func)
{
	return new Handlebars.SafeString(func.call(this));
});

module.exports = function(options)
{
	var template_cache = {},
		template_partials_cache = {},
		opts = _.extend({
			cache: false
		}, options);

	return function(filename, options, fn)
	{
		function main()
		{
			if (template_cache.hasOwnProperty(filename) && template_cache[filename] && opts.cache)
			{
				fn(null, template_cache[filename](options));
			}
			else
			{
				Fs.readFile(filename, { encoding: 'utf8' }, function(err, data)
				{
					if (err) throw err;

					var r = template_cache[filename] = Handlebars.compile(data);
					fn(null, r(options));
				});
			}
		}

		if (options.partials && typeof options.partials == 'object')
		{
			var basepath = Path.dirname(filename),
				i = 0,
				len = Object.keys(options.partials).length;

			for(var f in options.partials)
			{
				var partial_filename = Path.join(basepath, options.partials[f]);
				if (template_partials_cache.hasOwnProperty(partial_filename) && template_partials_cache[partial_filename] && opts.cache)
				{
					(function(filename, key)
					{
						options.partials[key] = function() { return template_partials_cache[filename](options); };
					})(partial_filename, f);

					i++;
					if (i == len)
						main();
				}
				else
				{
					(function(filename, key)
					{
						Fs.readFile(filename, { encoding: 'utf8' }, function(err, data)
						{
							i++;
							if (!err)
							{
								var r = template_partials_cache[filename] = Handlebars.compile(data);
								options.partials[key] = function() { return r(options); };
							}

							if (i == len)
								main();
						});
					})(partial_filename, f);
				}
			}
		}
		else
			main();
	}
}