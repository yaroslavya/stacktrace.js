// TODO: AMD/CommonJS/etc wrapper
(function() {
    // V8 Only: See http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
    // TODO: configurable Error.stackTraceLimit = 20;
    Error.prepareStackTrace = function(error, stack) {
        var stackEntries = [];
        for(var i = 1, len = stack.length; i < len; i++) {
            var cur = stack[i];
            // IDEA: utilize getEvalOrigin: if this function was created using a call to eval returns a CallSite object representing the location where eval was called
            if (!cur.isNative()) {
                stackEntries.push(new StackEntry(cur.getFunctionName(), cur.getFileName(), cur.getLineNumber(), cur.getColumnNumber()))
            }
        }
    };

    function StackEntry(functionName, srcUrl, lineNumber, charNumber) {
        this.fn = functionName;
        this.args = [];
        this.src = srcUrl;
        this.line = lineNumber;
        this.char = charNumber;
    }

    function ErrorInfo(stack, message) {
        this.stack = stack;
        this.message = message;
    }

    function ErrorParser() {
        // TODO: declare regexps here

        /**
         * Given an Error object, return the function that
         * will extract the most information from it.
         * @param e {Error}
         * @return Function parser
         */
        this.chooseParser = function(e) {
            if (e['arguments'] && e.stack) {
                return this.parseV8;
            } else if (e.stack && e.sourceURL) {
                return this.parseNitro;
            } else if (e.stack && e.number) {
                return this.parseChakra;
            } else if (e['opera#sourceloc'] || e.stacktrace) {
                return this.parseOPERA;
            } else if (e.stack) {
                return this.parseSpiderMonkey;
            }
            return this.parseOther;
        };

        this.parseV8 = function(e) { // Chrome and node.js
            return new ErrorInfo(e.stack, e.message);
        };

        this.parseNitro = function(e) { //Safari 6
            /*
             stack: "@file:///Users/eric/src/javascript-stacktrace/test/functional/ExceptionLab.html:48\n" +
             "dumpException3@file:///Users/eric/src/javascript-stacktrace/test/functional/ExceptionLab.html:52\n" +
             "onclick@file:///Users/eric/src/javascript-stacktrace/test/functional/ExceptionLab.html:82\n" +
             "[native code]"
             */
            // TODO: optimization - can pull these RegExps out and only compile them once
            var raw = e.stack.replace(/\[native code\]\n/m, '')
                .replace(/^(?=\w+Error\:).*$\n/m, '')
                .replace(/^@/gm, '{anonymous}@')
                .split('\n');
            // TODO: check function identifier defn
            var re = /^([\{\}\w]+)@(.*)\:(\d+)(\:(\d+))?$/;
            var enhancedStack = raw.filter(function(entry) {
                return entry.indexOf('@') !== -1;
            }).map(function(entry) {
                var m = entry.match(re);
                return new StackEntry(m[1], m[2], m[3], m[5]);
            });
            return new ErrorInfo(enhancedStack, e.message);
        };

        this.parseChakra = function(e) {};
        this.parseSpiderMonkey = function(e) {};
        this.parseOPERA = function(e) {
            // e.message.indexOf("Backtrace:") > -1 -> opera
            // !e.stacktrace -> opera
            if (!e.stacktrace) {
                return 'opera9'; // use e.message
            }
            // 'opera#sourceloc' in e -> opera9, opera10a
            if (e.message.indexOf('\n') > -1 && e.message.split('\n').length > e.stacktrace.split('\n').length) {
                return 'opera9'; // use e.message
            }
            // e.stacktrace && !e.stack -> opera10a
            if (!e.stack) {
                return 'opera10a'; // use e.stacktrace
            }
            // e.stacktrace && e.stack -> opera10b
            if (e.stacktrace.indexOf("called from line") < 0) {
                return 'opera10b'; // use e.stacktrace, format differs from 'opera10a'
            }
            // e.stacktrace && e.stack -> opera11
            return 'opera11'; // use e.stacktrace, format differs from 'opera10a', 'opera10b'
        };
        this.parseOther = function(e) {};
        this.guessAnonymousFunctionName = function() {
            // IDEA: can we use sourcemaps here?
        };
    }

    Error.prototype.parseError = function parseError(e) {

    };

    window.ErrorParser = ErrorParser;
})();