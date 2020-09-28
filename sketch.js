let frame;
let scale_r;
let win_dim;
let frame_rect;
let s3;
let grid_lines;
let t_select;
let triangles;
let points = [];

function setup () {
	createCanvas(windowWidth, windowHeight);
	
	s3 = sqrt (3);
	
	frame = createVector(12, 8, 1);
	win_dim = createVector(windowWidth, windowHeight);
	scale_r = min (win_dim.x / frame.x, win_dim.y / frame.y);
	scale_r *= 0.8;
	frame_center = p5.Vector.div (win_dim, 2);
	calc_grid_lines ();
	generate_triangles ();
	noLoop ();
}

function draw () {
	translate (windowWidth / 2, windowHeight / 2);
	scale (scale_r);
	background (100);
	// draw_frame ();
	
	triangles.map (draw_triangle);
	// draw_triangle (t_select);
}

function draw_frame ()
{
	rectMode (CENTER);
	rect (0, 0, frame.x, frame.y);
	draw_grid ();
}

function mouse_to_frame ()
{
	return createVector ((mouseX - windowWidth / 2) / scale_r,
											 (mouseY - windowHeight / 2) / scale_r);
}

function frame_to_hex (p)
{
	let f = createVector (s3/6 * p.x - 1/6 * p.y,
											 -s3/6 * p.x - 1/6 * p.y,
													           1/3 * p.y);
	let ft = createVector (ceil (f.x - f.y),
												 ceil (f.y - f.z),
												 ceil (f.z - f.x));	
	return createVector (round ((ft.y - ft.z)/3),
										   round ((ft.z - ft.x)/3),
										   round ((ft.x - ft.y)/3));
}

function hex_to_frame (h)
{
	return createVector (- h.y * s3 * 2 - h.x * s3, 
															        - h.x * 3);
}

function rotate_t (t, p, d = 1)
{
  let ang = - PI * 2/3 * t.d + PI * (t.p + 1) / 2;
  let c = cos (ang);
  let s = sin (ang) * d;
  return createVector (p.x * c - p.y * s,
                       p.x * s + p.y * c);
}

function vert_to_frame (t, v)
{
  let vert = createVector ();
  if (v === 1)
    vert.add (s3, t.o);
  else if (v === 2)
    vert.add (s3);
  
  vert  = rotate_t (t, vert);
  
  vert.add (hex_to_frame (t.h)); 
  return vert;
}

function frame_to_triangle (p)
{
	let h = frame_to_hex (p);
	p.sub (hex_to_frame  (h));

	let sector = (floor (atan2 (p.y, p.x) * 6 / PI + 6) + 7) % 12;
  let s2 = floor (sector / 2);
  
  let t =  {h: h, 
            d: s2 % 3,
            p: (s2 % 2) * 2 - 1,
            o: (sector % 2) * 2 - 1};
  
  p = rotate_t (t, p, -1);
  p.y *= t.o;

	return [t, p];
}

function mouseClicked() {
  let p;
	[t_select, p] = frame_to_triangle (mouse_to_frame ());
  print_triangle (t_select);
  points.push (p);
  
  redraw ();
  return false;
}

function mouseWheel (event) {
	new_scale = scale_r / pow (1.05, event.delta / 100);
	if (new_scale > 10 & new_scale < 1000)
		scale_r = new_scale;
	
  calc_grid_lines ();	

  redraw ();
  return false;
}

function draw_grid ()
{
	strokeWeight (1 / scale_r);
	stroke (50);
	grid_lines.forEach (l => line (l[0].x, l[0].y, l[1].x, l[1].y));
}

function draw_triangle (t)
{
	if (!t)
		return;
	push ();
	let v = [createVector (0, 0), 
					 createVector (s3, 0),
					 createVector (s3, 1)];
	translate (hex_to_frame (t.h));
  rotate (- PI * 2/3 * t.d + PI * (t.p + 1) / 2);
  scale (1, t.o); 
	fill (255, 255, 200);
	// noStroke ();
  // triangle (v[0].x, v[0].y, v[1].x, v[1].y, v[2].x, v[2].y);
  fill (0);
  strokeWeight (1 / scale_r);
  points.map (p => circle (p.x, p.y, 0.05));
  pop ();
}

function calc_grid_lines ()
{
	let f2 = p5.Vector.div(frame, 2);
	
	grid_lines = [];

	add_line = (o, n) =>
	{
		let intersect = (fx, fy, ox, oy, nx, ny) => 
		{
			if (abs (ny) < 0.0001) return false;
			let y =  (oy - (fx - ox) * nx / ny);
			return (y < fy && y > -fy) ? y : false;
		}	
		let l = [];
		intersect_x = (fx) => 
		{
			let y = intersect (fx, f2.y, o.x, o.y, n.x, n.y); 
	 	  if (y !== false) l.push (createVector (fx, y));
		}
  	intersect_y = (fy) => 
		{
			let x = intersect (fy, f2.x, o.y, o.x, n.y, n.x); 
	  	if (x !== false) l.push (createVector (x, fy));
		}
		intersect_x (f2.x);
		intersect_x (-f2.x);
		intersect_y (f2.y);
		intersect_y (-f2.y);

		if (l.length === 2)
			grid_lines.push (l);
		return (l.length === 2);		
	}
	
	let add_lines = (n) =>
	{
		let ret = true;
		let o = createVector (0, 0);
		add_line (o, n);
		while (ret)
		{
			o.add (n);
			ret = ret && add_line (o.mult (-1), n);
			ret = ret && add_line (o.mult (-1), n);
		}
	}
	add_lines (createVector (s3, 0));
	add_lines (createVector (s3 * 1.5, 1.5));
	add_lines (createVector (s3 * 0.5, 1.5));
	add_lines (createVector (0, 3));
	add_lines (createVector (s3 * -0.5, 1.5));
	add_lines (createVector (s3 * -1.5, 1.5));
}

function print_triangle (t)
{
	print (t.h.array () 
				 + " d:" + t.d
				 + " p:" + t.p 
				 + " o:" + t.o );
}

function hex_neighbour (h, d, p, r = 1)
{
	let a = h.array ();
	a [(d + 1) % 3] += p * r;
	a [(d + 2) % 3] -= p * r;
	let new_h = createVector ();
	new_h.set (a);
	return new_h;
}

function for_each_dp (f)
{
	for (let d = 0; d < 3; d++)
		for (let p = -1; p < 2; p+= 2)
			f (d, p);
}

function for_each_dpo (f)
{
	for_each_dp ((d,p) => 
  {
		for (let o = -1; o < 2; o+= 2) 
			f (d, p, o);
	});
}

function generate_triangles ()
{
  let f2 = p5.Vector.div(frame, 2);	
  let is_inside = (p) => { return (abs (p.x) < f2.x && abs (p.y) < f2.y); };
  let is_almost_inside = (p) => { return (abs (p.x) < (f2.x + s3) && abs (p.y) < (f2.y + 2)); };

	triangles = [];
	
	let add_hex = (h) =>
	{
    let f = hex_to_frame (h);
		if (is_inside (f))
		  for_each_dpo ((dt, pt, o) => triangles.push ({h:h, d:dt, p:pt, o:o}));
		else if (is_almost_inside (f))
      for_each_dpo ((dt, pt, o) =>
      {
        let t = {h:h, d:dt, p:pt, o:o};
        if (is_inside (vert_to_frame (t, 1)) || is_inside (vert_to_frame (t, 2)) )
         triangles.push (t);
      });
	}
	
	let h0 = createVector (0, 0, 0);
	let r = 0;
	
	let added = true;
	let triangles_n = triangles.length;
	add_hex (h0);
  while (r < 2 && triangles_n < triangles.length)
	{
		r++;
		triangles_n = triangles.length;
		for_each_dp ((d,p) => 
	  {
			let len_before = triangles.length;
	  	let h1 = hex_neighbour (h0, d, p, r);
	  	for (let i = 0; i < r; i++)
	  		add_hex (hex_neighbour (h1, (d+1) % 3, p, i));
	  });
	}
}