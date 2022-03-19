const Bottleneck = require("bottleneck");
const StlThumbnailer = require('node-stl-to-thumbnail');
const fs = require('fs');
const ExternalProgram = require('./external');

module.exports = class SuperSlicer extends ExternalProgram {
	constructor(location, logger, maxConcurrent) {
		super(location, logger, 'superslicer')
		this.logger = logger;
		this.limiter = new Bottleneck({
			maxConcurrent: maxConcurrent,
		});
	}

	doAction(args) {
		return this.limiter.schedule(() => this.execute(args));
	}

	convertProfiles(profiles) {
		const args = [];
		profiles.forEach(profile => {
			args.push('--load');
			args.push(profile);
		});
		return args;
	}

	resetXy(profiles, input, output, x, y, rotate) {
		return new Promise((res, rej) => {
			this.doAction([
				'--export-stl',
				...this.convertProfiles(profiles),
				'--output',
				output,
				'--rotate',
				rotate,
				// '--align-xy',
				// x + ',' + y,
				input,
			]).then(() => {
				this.doAction([
					'--export-stl',
					...this.convertProfiles(profiles),
					'--output',
					output,
					// '--align-xy',
					'--center',
					x + ',' + y,
					// '--rotate',
					// rotate,
					input,
				]).then(() => {
					res();
				});
			});
		})

		// console.log(input)
		// console.log(output)
		// console.log(rotate)
		// console.log(x)
		// console.log(y)
		// return 
	}

	combine(profiles, inputFiles, output) {
		return this.doAction([
			'--export-stl',
			...this.convertProfiles(profiles),
			'--merge',
			'--dont-arrange',
			'--output',
			output,
			...inputFiles
		]);
	}

	chunkSubstr(str, size) {
		const numChunks = Math.ceil(str.length / size)
		const chunks = new Array(numChunks)

		for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
			chunks[i] = str.substr(o, size)
		}

		return chunks;
	}

	prependToFile(str, file) {
		let data = fs.readFileSync(file).toString().split("\n");
		data.splice(1, 0, str);
		let text = data.join("\n");

		fs.writeFileSync(file, text);
	}

	slice(profiles, inputFile, output) {
		return new Promise((res, rej) => {
			this.doAction([
				'-g',
				...this.convertProfiles(profiles),
				'--output',
				output,
				inputFile
			]).then(() => {
				// do thumbnail
				const width = 500;
				const heigth = 500;

				new StlThumbnailer({
					filePath: inputFile,
					requestThumbnails: [
						{
							width: width,
							height: heigth,
							baseOpacity: 1,
							cameraAngle: [10, 10, 100],
							backgroundColor: 0x00ff00,
							baseColor: 0xff0000,
							lineColor: 0x000000
						}
					]
				}).then(thumbnails => {
					thumbnails[0].toBuffer((err, buf) => {
						var base64 = buf.toString('base64');

						// fs.writeFileSync(plate.file+".png", buf);

						let str = ";\r\n"
						str += "; thumbnail begin "+width+"x"+heigth+" " + base64.length + " \r\n";
						str += "; " + this.chunkSubstr(base64, 78).join("\r\n; ") + "\r\n"
						str += "; thumbnail end"
						str += ";"

						this.prependToFile(str, output);

						// structure of thumbnail to document

						// ;
						// ; thumbnail begin 48x48 3856
						// ; iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAALEUlEQVR4AY1a31NTZxrOTHLwT9hLx+
						// ; u/3wCNW/pZlsejjAAAAABJRU5ErkJggg==
						// ; thumbnail end
						// ;

						res();
					});
				});
			});
		});
	}
}