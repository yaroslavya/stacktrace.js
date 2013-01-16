// TODO: AMD/CommonJS/etc wrapper
(function() {
    function StackEntry(functionName, srcUrl, lineNumber, charNumber) {
        // TODO: if used without `new` create a new instance
        return {
            fn: functionName,
            args: [],
            src: srcUrl,
            line: lineNumber,
            char: charNumber
        }
    }
    function ErrorInfo(stack, message) {
        return {
            stack: stack,
            message: message
        }
    }
    function ErrorParser() {
        // TODO: declare regexps here
        return {
            /**
             * Given an Error object, return the function that
             * will extract the most information from it.
             * @param e {Error}
             * @return Function parser
             */
            chooseParser: function(e) {
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
            },
            parseV8: function(e) { //Chrome and node.js
                /*
                 stack: "TypeError: Object #<Object> has no method 'undef'\n" +
                 "    at Object.createException (http://127.0.0.1:8000/js/stacktrace.js:42:18)\n" +
                 "    at Object.run (http://127.0.0.1:8000/js/stacktrace.js:31:25)\n" +
                 "    at printStackTrace (http://127.0.0.1:8000/js/stacktrace.js:18:62)\n" +
                 "    at bar (http://127.0.0.1:8000/js/test/functional/testcase1.html:13:17)\n" +
                 "    at bar (http://127.0.0.1:8000/js/test/functional/testcase1.html:16:5)\n" +
                 "    at foo (http://127.0.0.1:8000/js/test/functional/testcase1.html:20:5)\n" +
                 "    at http://127.0.0.1:8000/js/test/functional/testcase1.html:24:4"
                 */
                var raw = (e.stack + '\n').replace(/^\S[^\(]+?[\n$]/gm, '')
                    .replace(/^\s+(at eval )?at\s+/gm, '')
                    .replace(/^([^\(]+?)([\n$])/gm, '{anonymous}()@$1$2')
                    .replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}()@$1')
                    .split('\n');

                var re = /^\s+at ([\{\}\w]+) \((.*)\:(\d+)(\:(\d+))?$/;
                var enhancedStack = raw.filter(function(entry) {
                    return entry.indexOf(' (') !== -1;
                }).map(function(entry) {
                    var m = entry.match(re);
                    return new StackEntry(m[1], m[2], m[3], m[5]);
                });
                return new ErrorInfo(enhancedStack, e.message);
            },
            parseNitro: function(e) { //Safari 6
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
            },
            parseChakra: function(e) {},
            parseSpiderMonkey: function(e) {},
            parseOPERA: function(e) {
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
            },
            parseOther: function(e) {},
            guessAnonymousFunctionName: function() {
                // IDEA: can we use sourcemaps here?
            }
        };
    }

    Error.prototype.parseError = function parseError(e) {

    };

    window.ErrorParser = ErrorParser;
})();