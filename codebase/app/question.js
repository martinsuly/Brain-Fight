var words = require('./words.js');

module.exports = function(level)
{

	function getWordsCount()
	{
		return words.length;
	}

	function getWord(i)
	{
		var word = words[i];

		var size = word.indexOf(' ');
		if(size < 0)size = word.indexOf('\n');
		return word.substr(0, size);
	}

	function rotate(s)
	{
		var a = Math.random() * 2 * Math.PI;
		for(var i = 0; i < s.length; i++)
		{
			var x;
			x = s[i].x * Math.cos(a) + s[i].y * Math.sin(a);
			s[i].y = s[i].y * Math.cos(a) - s[i].x * Math.sin(a);
			s[i].x = x;
		}
	}

	function clamp(x, a, b)
	{
		if(x < a)return a;
		if(x > b)return b;
		return x;
	}

	function genPoint(i, angles, rang, rrad)
	{
		rang = clamp(rang, 0, 1);
		rrad = clamp(rrad, 0, 1);
		var ang = 2 * Math.PI * (i + 0.8 * rang - 0.4) / angles;
		var rad = 0.5;
		if(i > 1)rad *= 0.7 * rrad + 0.3;
		return {'x': rad * Math.sin(ang), 'y': rad * Math.cos(ang)};
	}

	function random(n)
	{
		return Math.floor(Math.random() * n);
	}

	function randomInterval(a, b)
	{
		return a + random(b - a + 1);
	}
	function lerp(a, b, f)
	{
		return a + (b - a) * f;
	}

	function generatePolyfits(level)
	{
		var angles = 3 + random(10);
		var factor = lerp(1.0, 0.2, level / 100);
		var quest = [];
		var right = [];
		var wrong = [[], [], []];
		for(var i = 0; i < angles; i++)
		{
			var rang = Math.random();
			var rrad = Math.random();
			quest.push(genPoint(i, angles, rang, rrad));
			right.push(genPoint(i, angles, rang, rrad));
			for(var j = 0; j < wrong.length; j++)
			{
				var ra = rang + (Math.random() - 0.5) * factor;
				var rr = rrad + (Math.random() - 0.5) * factor;
				wrong[j].push(genPoint(i, angles, ra, rr));
			}
		}
		rotate(quest);
		rotate(right);
		for(var j = 0; j < wrong.length; j++)
			rotate(wrong[j]);
		return {'type': 'polyfits', 'quest': quest, 'right': right, 'wrong': wrong};
	}

	function random3(a, range)
	{
		range = Math.floor(range);
		if(range < 2)range = 2;
		var vals = [];
		for(var i = 0; i < 3; i++)
		{
			var v = 0;
			while((v == 0) || (vals.indexOf(v) != -1))
				v = random(2 * range + 1) -  range;
			vals.push(v);
		}
		return vals;
	}

	function generateMultiplic(level)
	{
		if(level < 10)
			range = [2, 9, 2, 9];
		else if(level < 40)
			range = [10, 99, 2, 9];
		else if(level < 70)
			range = [10, 99, 10, 99];
		else if(level < 90)
			range = [100, 999, 10, 99];
		else
			range = [100, 999, 100, 999];
		var a, b, ch;
		a = randomInterval(range[0], range[1]);
		b = randomInterval(range[2], range[3]);
		var r = a * b;
		var rr = random3(r, r / (5 * range[0]));
		var r1 = r + rr[0] * range[0];
		var r2 = r + rr[1] * range[0];
		var r3 = r + rr[2] * range[0];
		return {'type': 'multiplic', 'quest': a.toString() + ' x ' + b.toString(), 'right': r, 'wrong': [r1, r2, r3]};
	}

	function adjustTree(tree, deep)
	{
		while(tree.length <= deep)
		{
			var lay = [];
			for(var i = 0; i < 1 << deep; i++)
				lay.push(false);
			tree.push(lay);
		}
	}

	function countTerminals(tree, deep, node)
	{
		if(deep === undefined)deep = 0;
		if(node === undefined)node = 0;
		adjustTree(tree, deep);
		if(!tree[deep][node])return 1;
		return countTerminals(tree, deep + 1, 2 * node) + countTerminals(tree, deep + 1, 2 * node + 1);
	}

	function addOperator(tree, place, deep, node, idx)
	{
		if(deep === undefined)deep = 0;
		if(node === undefined)node = 0;
		if(idx === undefined)idx = 0;
		adjustTree(tree, deep);
		if(!tree[deep][node])
		{
			if(place == idx)tree[deep][node] = true;
			return 1;
		}
		var cnt = addOperator(tree, place, deep + 1, 2 * node, idx);
		return cnt + addOperator(tree, place, deep + 1, 2 * node + 1, idx + cnt);
	}

	function genFunction(tree, num_seq, ops, deep, node)
	{
		if(deep === undefined)deep = 0;
		if(node === undefined)node = 0;
		adjustTree(tree, deep);
		if(!tree[deep][node])
		{
			if(Math.random() < 0.5)
			{
				tree[deep][node] = random(5) + 1;
				return tree[deep][node];
			}
			else
			{
				tree[deep][node] = -random(num_seq) - 1;
				return 'x' + (num_seq + tree[deep][node]);
			}
		}
		tree[deep][node] = ops[random(ops.length)];
		return '(' + genFunction(tree, num_seq, ops, deep + 1, 2 * node) + ' ' +
			tree[deep][node] + ' ' + genFunction(tree, num_seq, ops, deep + 1, 2 * node + 1) + ')';
	}

	function evalFunction(tree, seq, deep, node)
	{
		if(deep === undefined)deep = 0;
		if(node === undefined)node = 0;
		adjustTree(tree, deep);
		if(typeof tree[deep][node] == 'number')
		{
			if(tree[deep][node] < 0)
				return seq[seq.length + tree[deep][node]];
			else
				return tree[deep][node];
		}
		var a = evalFunction(tree, seq, deep + 1, 2 * node);
		var b = evalFunction(tree, seq, deep + 1, 2 * node + 1);
		switch(tree[deep][node])
		{
			case '+': return a + b;
			case '*': return a * b;
			case '-': return a - b;
			case '/': return Math.floor(a / b);
			case '%': return a % b;
		}
	}

	function generateSequence(level)
	{
		var num_seq = 1 + Math.floor(level / 30);
		var num_pred = 4 + level / 10;

		var num_ops = 1;
		if(level > 5)num_ops = 2;
		if(level > 10)num_ops = 3;
		if(level > 15)num_ops = 4;
		if(level > 20)num_ops = 5;
		if(level > 30)num_ops = 6;
		if(level > 40)num_ops = 7;
		num_ops = 1 + random(num_ops);

		var ops = ['+'];
		if(level > 10)ops.push('-');
		if(level > 20)ops.push('*');
		if(level > 50)ops.push('/');
		if(level > 80)ops.push('%');

		var tree = [];
		var f;
		var again;
		var seq = [];
		for(var i = 0; i < num_seq; i++)
			seq.push(random(10) + 1);
		do
		{
			again = false;
			tree.length = 0;
			for(var i = 0; i < num_ops; i++)
				addOperator(tree, random(countTerminals(tree)));
			f = genFunction(tree, num_seq, ops);
			seq.length = num_seq;
			for(var i = 0; i < num_pred; i++)
				seq.push(evalFunction(tree, seq));
			for(var i = 0; i < seq.length; i++)
			{
				if(!(seq[i] <= 200))again = true;
				if(!(seq[i] >= -200))again = true;
			}
			if(seq[seq.length - 1] == seq[seq.length - 2])again = true;
		}
		while(again);

		var quest = '';
		for(var i = 0; i < seq.length - 1; i++)
		{
			if(i > 0)
				quest += ', ';
			quest += seq[i];
		}
		quest += ', ?';

		var r = seq[seq.length - 1];
		var rr = random3(r, r / 5);
		return {'type': 'sequence', 'quest': quest, 'right': r, 'wrong': [r + rr[0], r + rr[1], r + rr[2]]};
	}

	function hex(i)
	{
		var s = i.toString(16);
		if(s.length < 2)s = "0" + s;
		return s;
	}

	function rgb(r, g, b)
	{
		return "#" + hex(r) + hex(g) + hex(b);
	}

	function randColor(level)
	{
		var mid;
		if(level < 20)
			mid = random(5 * level);
		else if(level < 50)
		{
			mid = random(level + 60);
			if(Math.random() < 0.5)
				mid = 255 - mid;
		}
		else
			mid = random(255);
		var r = [0, mid, 255];
		var t, i;
		i = random(3);
		t = r[0];
		r[0] = r[i];
		r[i] = t;
		i = random(2) + 1;
		t = r[1];
		r[1] = r[i];
		r[i] = t;
		return r;
	}

	function atorgb(a)
	{
		return rgb(a[0], a[1], a[2])
	}

	function randomizeChan(chan, factor)
	{
		var d = (random(64) + 64) * factor;
		if(Math.random() < 0.5)d = -d;
		if((chan + d > 255) || (chan + d < 0))d = -d;
		return Math.floor(chan + d);
	}

	function randomizeColor(c, f)
	{
		return [randomizeChan(c[0], f), randomizeChan(c[1], f), randomizeChan(c[2], f)];
	}

	function generateColors(level)
	{
		var factor = lerp(1, 0.5, level / 100);
		var cfac = lerp(0, 0.5, level / 100);
		var a = randColor(level);
		var b;
		do
		{
			b = randColor(level);
		}
		while(Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 200);
		var c = [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
		var m = Math.max(c[0], Math.max(c[1], c[2]));
		c[0] = Math.floor(c[0] * 255 / m);
		c[1] = Math.floor(c[1] * 255 / m);
		c[2] = Math.floor(c[2] * 255 / m);
		var right = c;
		var w1 = randomizeColor(c, factor);
		var w2 = randomizeColor(c, factor);
		var w3 = randomizeColor(c, factor);
		var quest = {'a': atorgb(a), 'b': atorgb(b)};
		return {'type': 'colors', 'quest': quest, 'right': atorgb(right), 'wrong': [atorgb(w1), atorgb(w2), atorgb(w3)]};
	}

	function generateWords(level)
	{
		var cnt = getWordsCount();
		var range = 10000;
		var i = range + 100 + Math.floor((cnt - 1 - 2 * (100 + range)) * level / 100) + random(2 * range) - range;
		var r = getWord(i);
		var quest = r;
		for(var k = quest.length - 1; k > 0; k--)
		{
			var t, a, b;
			j = random(k + 1);
			if(j != k)
			{
				a = quest.charAt(j);
				b = quest.charAt(k);
				quest = quest.substring(0, j) + b + quest.substring(j + 1, k) + a + quest.substring(k + 1, quest.length);
			}
		}
		var w = random3(i, 100);
		var wrong = [getWord(i + w[0]), getWord(i + w[1]), getWord(i + w[2])];
		return {'type': 'words', 'quest': quest, 'right': r, 'wrong': wrong};
	}

	function generate(level)
	{
		if(level < 0)level = 0;
		if(level > 100)level = 100;

		var client;
		var game = random(5);
		if(game == 0)
			client = generatePolyfits(level);
		else if(game == 1)
			client = generateMultiplic(level);
		else if(game == 2)
			client = generateSequence(level);
		else if(game == 3)
			client = generateColors(level);
		else if(game == 4)
			client = generateWords(level);

		var corr = random(4);
		client.wrong.splice(corr, 0, client.right);
		var corrname = ['A', 'B', 'C', 'D'];
		return {'server': corrname[corr], 'client': {'type': client.type, 'quest': client.quest,
			'a': client.wrong[0], 'b': client.wrong[1], 'c': client.wrong[2], 'd': client.wrong[3]}};
	}

	return generate(level);
}