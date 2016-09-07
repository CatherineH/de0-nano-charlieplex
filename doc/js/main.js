var SVG_drawing = function (num_across, num_down, image_height, image_width,
                            right_margin, bottom_margin) {
    if (num_across === undefined) {
        num_across = 9;
    }
    this.num_across = num_across;

    if (num_down === undefined) {
        num_down = 8;
    }
    this.num_down = num_down;

    if (image_height === undefined) {
        image_height = 400;
    }
    this.image_height = image_height;

    if (image_width === undefined) {
        image_width = 600;
    }
    this.image_width = image_width;

    if (right_margin === undefined) {
        right_margin = 30;
    }
    this.right_margin = right_margin;

    if (bottom_margin === undefined) {
        bottom_margin = 30;
    }
    this.bottom_margin = bottom_margin;
    this.led_loaded = false;
    this.svg_init = false;
    function position(i, j)
    {
        var _x_pos = LED_scale*(this.new_width*(this.num_across-i-1)/LED_scale+this.right_margin);
        var _y_pos = LED_scale*((this.image_height/this.num_down)*j/LED_scale+this.bottom_margin);
        return [_x_pos, _y_pos];
    }

    // create a map of the nodes
    this.nodes = [];
    // node types;
    // 0 - not a diode (i.e., diag, entry_pins, entrya)
    // 1 - diode entry (i.e., entryb)
    // 2 - diode exit (i.e., exit)
    // connections going 2 to 1 are not allowed. Since entries have buffers,
    // only certain exits to uncorrelated entries aren't a problem.

    this.new_width = this.image_width/this.num_across;
    // generate the nodes, type by type.
    // first, entry pins
    for(var i=0; i<this.num_across; i++)
    {
        var pos = position(i, 0);
        var node = {x_pos:pos[0] + LED_entries[1][0]*LED_scale, y_pos:y_pos[1],
        size:junction_radius,
        name: "0entry_pin_"+i,
        neighbors: []};
        this.nodes.push(node);
    }
    // next, the diagonals
    for(var i=0; i< _.min([this.num_across, this.num_down]); i++)
    {
        var pos = position(i, i);
        var y_pos = pos[1] + LED_entries[1][1]*LED_scale+LED_dimensions[1]*LED_scale/2.0;
        var x_pos = pos[0] + LED_entries[1][0]*LED_scale;
        var node = {x_pos: x_pos, y_pos:y_pos, size:junction_radius*4,
                    name: "0diag_"+i, neighbors: []};
        this.nodes.push(node);
    }
    for(var i=0; i<this.num_across;i++)
    {
        for(var j=0; j<this.num_down;j++)
        {
            // add the entry node
            var next_i = i+1;
            var next_j = j+1;
            var prev_i = i-1;
            var prev_j = j-1;
            // add the output pin terminals
            if(j==0)
            {
                if(i!=0)
                {
                    var _neighbors = ["2exit_"+i+"_0"];
                }
                var node = {x_pos:x_pos + LED_entries[1][0]*LED_scale, y_pos:y_pos,
                            size:junction_radius,
                            name: "0entry_pin_"+i,
                            neighbors: _neighbors};
                this.nodes.push(node);

            }

            // add the diode entry locations
            // the entry pins have two locations - one over the pin, and one
            // above if j < i, or below if j>=i.
            if(j>i)
            {
                var y_pos_a = y_pos + LED_entries[1][1]*LED_scale+LED_dimensions[1]*LED_scale;
                var y_pos_b = y_pos + LED_entries[1][1]*LED_scale+LED_dimensions[1]*LED_scale/2.0;
            }
            else if(i==j)
            {
                var y_pos_b = y_pos + LED_entries[1][1]*LED_scale+LED_dimensions[1]*LED_scale/2.0;
                var y_pos_a = y_pos_b;
            }
            else{
                var y_pos_a = y_pos + LED_dimensions[1]*LED_scale/4.0;
                var y_pos_b = y_pos + LED_entries[1][1]*LED_scale;
            }
            var _neighbors = ["1entryb_"+i+"_"+j];

            if(next_i < this.num_across && j<i)
            {
                _neighbors.push("0entrya_"+next_i+"_"+j);
            }
            /*
            else if(i==j)
            {
                _neighbors.push("0diag_"+i)
            }*/

            if(i>0 && j==0)
            {
                _neighbors.push("0entry_pin_"+i);
            }

            var node = {x_pos:x_pos + LED_entries[0][0]*LED_scale,
                        y_pos:y_pos_a,
                        size:junction_radius, name:"0entrya_"+i+"_"+j,
                        neighbors: _neighbors};
            this.nodes.push(node);
            var _neighbors = ["2exit_"+i+"_"+j], "0entrya_"+i+"_"+j];
            var node = {x_pos:x_pos + LED_entries[0][0]*LED_scale,
                        y_pos:y_pos_b,
                        size:junction_radius, name:"1entryb_"+i+"_"+j,
                        neighbors: _neighbors};
            this.nodes.push(node);

            // add the diode exit locations

            if(next_i == j)
            {
            //    var _neighbors = ["diag_"+j];
            }
            // the final corner needs to be connected to the bottom right half corner
            else if(j==7 && i==8){
                var _neighbors = ['0entrya_'+prev_i+"_"+j];
            }
            else{
                var _neighbors = [];
            }

            if(next_j < this.num_down)
            {
                _neighbors.push("2exit_"+i+"_"+next_j);
            }
            var node = {x_pos:x_pos + LED_entries[1][0]*LED_scale,
                        y_pos:y_pos_b,
                        size:junction_radius, name:"2exit_"+i+"_"+j,
                        neighbors: _neighbors};
            this.nodes.push(node);
        }
    }
    // mirror the connections
    for(var i = 0; i<this.nodes.length; i++)
    {
        for(var j = 0; j<this.nodes.length; j++)
        {
            //console.log(i, j, this.nodes[i], this.nodes[j])
            var ni = _.indexOf(this.nodes[j].neighbors, this.nodes[i].name);
            if(ni != -1 && !(this.nodes[i].name[0] == '2' && this.nodes[j].neighbors[ni][0]=='1'))
            {
                if(!_.contains(this.nodes[i].neighbors, this.nodes[j].neighbors[ni]))
                {
                    console.log(ni, this.nodes[j].neighbors[ni])
                    this.nodes[i].neighbors.push(this.nodes[j].name);
                }
            }
        }
    }

};
var LED_entries = [[4, 50], [103, 50]];
var LED_dimensions = [106.0, 71.0];
var LED_scale = .5;
var junction_radius = 1.0;


SVG_drawing.prototype.drawSVG = function(){
    var drawn_connections = [];
    function connect_points(i, j)
    {
        drawn_connections.push(i+"_"+j);
        //drawn_connections.push(j+"_"+i);
        console.log("indices: "+i+" "+j);
        console.log(i, drawing.nodes[i].name, j, drawing.nodes[j].name);
        // make sure the connection is only drawn once
        if(!_.contains(drawn_connections, j+"_"+i))
        {
            var x_poss = [drawing.nodes[i].x_pos, drawing.nodes[j].x_pos];
            var y_poss = [drawing.nodes[i].y_pos, drawing.nodes[j].y_pos];
            var attrs = { stroke: 'black', strokeWidth: 1*LED_scale};
            // if the points line up to an x/y grid, plot a single line

            if(x_poss[0] == x_poss[1] || y_poss[0] == y_poss[1])
            {
                drawing.s.line(x_poss[0], y_poss[0], x_poss[1], y_poss[1]).attr(attrs);

            }
            // else, plot an L curve
            else{
                drawing.s.line(x_poss[0], y_poss[0], x_poss[0], y_poss[1]).attr(attrs);
                drawing.s.line(x_poss[0], y_poss[1], x_poss[1], y_poss[1]).attr(attrs);
            }
        }
     }
    function find_index(name)
    {
        for(var i=0; i<drawing.nodes.length; i++)
        {
            if(drawing.nodes[i].name == name)
            {
                return i;
            }
        }
        console.log("could not find index of: "+name);
    }
    function walk(walk_index)
    {
        console.log(walk_index, drawing.nodes[walk_index].name);
        console.log(drawing.nodes[walk_index].neighbors);
        for(var ni=0; ni < drawing.nodes[walk_index].neighbors.length; ni++)
        {
            var neighbor_index = find_index(drawing.nodes[walk_index].neighbors[ni]);
            if(!_.contains(drawn_connections, walk_index+"_"+neighbor_index))
            {
                connect_points(walk_index, neighbor_index);
                walk(neighbor_index);
            }
        }
    }
    var LED_points = [[35, 68], [35, 31], [66, 50]];

    var aspect_ratio = LED_dimensions[1]/LED_dimensions[0];
    var new_height = this.new_width*aspect_ratio;
    var LED_offsets = [this.new_width*LED_scale/2, new_height*LED_scale];
    var current_led = [2, 1];

    for(var i = 0; i < this.num_across; i++)
    {
        var x_pos = this.right_margin+this.new_width*(this.num_across-i-1)/LED_scale;

        for(j = 0; j< this.num_down;j++)
        {
            var y_pos = this.bottom_margin+(this.image_height/this.num_down)*j/LED_scale;
            var position = [x_pos+LED_offsets[0], y_pos+LED_offsets[1]];
            var text_transform = new Snap.Matrix();
            text_transform.scale(LED_scale);
            text_transform.translate(x_pos+LED_dimensions[0], y_pos);
            // add the label for the terminal pin
            if(j==0)
            {
                text = this.s.text(0, 0, i+1);
                text.transform(text_transform);

            }
            var led_clone = this.led_data.clone();
            var led_transform = new Snap.Matrix();

            // offset the lower right triangle
            if(j>=i)
            {
                y_pos += LED_dimensions[1]/2.0;

            }
            led_transform.scale(LED_scale);
            led_transform.translate(x_pos, y_pos);
            led_clone.transform(led_transform);


            if(i==current_led[0] && j==current_led[1])
            {
                led_clone.select("path[stroke='#000']").attr({fill: "#ffff00"});
            }
            this.s.append(led_clone);
        }
    }
    for(var i = 0; i < this.nodes.length; i++)
    {
        this.s.circle(this.nodes[i].x_pos, this.nodes[i].y_pos,
                      this.nodes[i].size).attr({ stroke: 'None', stroke_width: 0.3, fill: 'black' });
    }
    // walk through the node tree
    for(var i=0; i<this.num_across; i++)
    {
        var pin_index = find_index('0entry_pin_'+i);

        walk(pin_index);
    }

};


SVG_drawing.prototype.onSVGLoaded = function(data){
    drawing.led_data = data.select("g");
    drawing.led_loaded = true;
    if(drawing.svg_init && drawing.led_loaded)
    {
        drawing.drawSVG();
    }
};

SVG_drawing.prototype.initializeSVG = function(data){
    drawing.s = Snap("#svg");
    drawing.svg_init = true;
    if(drawing.svg_init && drawing.led_loaded)
    {
        drawing.drawSVG();
    }

};

var drawing = new SVG_drawing();
var loaded_led_svg = Snap.load("resources/Symbol_LED.svg", drawing.onSVGLoaded);
window.onload = drawing.initializeSVG;
