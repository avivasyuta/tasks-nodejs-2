const stream = require('stream');
const os = require('os');

class LineSplitStream extends stream.Transform {
  constructor(options) {
    super(options);

    this.remainder = '';
  }

  _transform(chunk, encoding, callback) {
    const str = this.remainder + chunk.toString();
    const lines = str.split(os.EOL);
    const lastLine = lines.pop();

    for (const line of lines) {
      this.push(line);
    }

    this.remainder = lastLine;

    callback();
  }

  _flush(callback) {
    if (this.remainder) {
      this.push(this.remainder);
    }

    callback();
  }
}

module.exports = LineSplitStream;
