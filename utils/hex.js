function bin2hex(x) {
	return x.match(/[01]{4}/g)
	.map(bin => parseInt(bin,2).toString(16))
	.join('');
}
function hex2bin(x) {
	return x.split('').
	map(h => parseInt(h,16).toString(2))
	.map(b => '0'.repeat(4-b.length) + b)
	.join('');
}

module.exports = {
	bin2hex: bin2hex,
	hex2bin: hex2bin
};
