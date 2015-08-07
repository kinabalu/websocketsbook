(function(exports){

    /**
     * Process Frame
     *
     * TODO: process the content-length header if it exists
     */
    exports.process_frame = function(data) {
        var lines = data.split("\n");
        var frame = {};
        frame['headers'] = {};
        if(lines.length>1) {
            frame['command'] = lines[0];
            var x = 1;
            while(lines[x].length>0) {
                var header_split = lines[x].split(':');
                var key = header_split[0].trim();
                var val = header_split[1].trim();
                frame['headers'][key] = val;
                x += 1;
            }
            frame['content'] = lines.splice(x + 1, lines.length - x).join("\n");
            frame['content'] = frame['content'].substring(0, frame['content'].length - 1);  // remove the \0
        }
        // console.log(JSON.stringify(frame));
        return frame;
    };

    exports.send_frame = function(ws, frame) {
        // add content-length header
        var data = frame['command'] + "\n";
        var header_content = "";
        for(var key in frame['headers']) {
            if(frame['headers'].hasOwnProperty(key)) {
                header_content += key + ": " + frame['headers'][key] + "\n";
            }
        }
        data += header_content;
        data += "\n\n";
        data += frame['content'];
        data += "\n\0";
        ws.send(data);
    };

    exports.send_error = function(ws, message, detail) {
        headers = {};
        if(message) headers['message'] = message;
        else headers['message'] = "No error message given";

        exports.send_frame(ws, {
            "command": "ERROR",
            "headers": headers,
            "content": detail
        });
    };

})(typeof exports === 'undefined'? this['Stomp']={}: exports);
