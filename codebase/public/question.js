function drawShape(id, s, mean, color)
{
	var c = document.getElementById(id);
	var g = c.getContext("2d")
	g.setTransform(1, 0, 0, 1, 0, 0);
	var br = {'x1': Number.MAX_VALUE, 'y1': Number.MAX_VALUE, 'x2': Number.MIN_VALUE, 'y2': Number.MIN_VALUE};
	for(var i = 0; i < s.length; i++)
	{
		br.x1 = Math.min(br.x1, s[i].x);
		br.y1 = Math.min(br.y1, s[i].y);
		br.x2 = Math.max(br.x2, s[i].x);
		br.y2 = Math.max(br.y2, s[i].y);
	}
	g.translate(c.width / 2, c.height / 2);
	g.scale(mean, mean);
	g.translate((-br.x1 - br.x2) / 2, (-br.y1 - br.y2) / 2);
	g.fillStyle = color;
	g.beginPath();
	g.moveTo(s[0].x, s[0].y);
	for(var i = 1; i < s.length; i++)
		g.lineTo(s[i].x, s[i].y);
	g.closePath();
	g.fill();
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

function random(n)
{
	return Math.floor(Math.random() * n);
}

function drawString(id, str)
{
	var c = document.getElementById(id);
	var g = c.getContext("2d")
	g.fillStyle = "black";
	g.textAlign = "center";
	g.textBaseline = "middle";

	g.font = c.height / 2 + "px Arial";
	var width = g.measureText(str).width;
	if(width >= c.width - 20)
		g.font = (c.height / 2) * (c.width - 20) / width + "px Arial";
	g.fillText(str, c.width / 2, c.height / 2);
}

function clear(id)
{
	var c = document.getElementById(id);
	var g = c.getContext("2d")
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.clearRect(0, 0, c.width, c.height);
}

function drawColor(id, mean, color)
{
	var c = document.getElementById(id);
	var g = c.getContext("2d")
	g.fillStyle = color;
	g.beginPath();
	g.arc(c.width / 2, c.height / 2, mean / 2, 0, 2 * Math.PI);
	g.fill();
	g.stroke();
}

function draw(id, ida, idb, idc, idd, q)
{
	var c = document.getElementById(id);
	var mean = Math.min(c.height, document.getElementById(ida).height) - 10;
	var g = c.getContext("2d");

	clear(id);
	clear(ida);
	clear(idb);
	clear(idc);
	clear(idd);

	if(q.type == 'polyfits')
	{
		var r = [0, random(150), 255];
		var t, i;
		i = random(3);
		t = r[0];
		r[0] = r[i];
		r[i] = t;
		i = random(2) + 1;
		t = r[1];
		r[1] = r[i];
		r[i] = t;
		var color = rgb(r[0], r[1], r[2]);

		g.fillStyle = color;
		g.fillRect(0, 0, c.width, c.height);
		drawShape(id, q.quest, mean, "#FFFFFF");
		drawShape(ida, q.a, mean, color);
		drawShape(idb, q.b, mean, color);
		drawShape(idc, q.c, mean, color);
		drawShape(idd, q.d, mean, color);
	}
	else if((q.type == 'multiplic') || (q.type == 'sequence') || (q.type == 'words'))
	{
		drawString(id, q.quest);
		drawString(ida, q.a);
		drawString(idb, q.b);
		drawString(idc, q.c);
		drawString(idd, q.d);
	}
	else if(q.type == 'colors')
	{
		g.font = mean + "px Arial";
		g.fillStyle = "black";
		g.textAlign = "center";
		g.textBaseline = "middle";
		g.fillText("+", c.width / 2, c.height / 2);
		var width = g.measureText("+").width;

		g.fillStyle = q.quest.a;
		g.beginPath();
		g.arc((c.width - mean - width) / 2 - 10, c.height / 2, mean / 2, 0, 2 * Math.PI);
		g.fill();
		g.stroke();

		g.fillStyle = q.quest.b;
		g.beginPath();
		g.arc((c.width + mean + width) / 2 + 10, c.height / 2, mean / 2, 0, 2 * Math.PI);
		g.fill();
		g.stroke();

		drawColor(ida, mean, q.a);
		drawColor(idb, mean, q.b);
		drawColor(idc, mean, q.c);
		drawColor(idd, mean, q.d);
	}
}
