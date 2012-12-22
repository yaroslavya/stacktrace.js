// TODO: AMD/CommonJS/etc wrapper
(function() {
    function ErrorParser() {
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
                    return this.parseSAFARI;
                } else if (e.stack && e.number) {
                    return this.parseIE;
                } else if (typeof e.message === 'string' && typeof window !== 'undefined' && window.opera) {
                    return this.parseOPERA;
                } else if (e.stack) {
                    return this.parseFIREFOX;
                }
                return this.parseCRAPPY;
            },
            parseV8: function(e) {
                var stack = (e.stack + '\n').replace(/^\S[^\(]+?[\n$]/gm, '').
                    replace(/^\s+(at eval )?at\s+/gm, '').
                    replace(/^([^\(]+?)([\n$])/gm, '{anonymous}()@$1$2').
                    replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}()@$1').split('\n');
                stack.pop();
                return stack;
            },
            parseSAFARI: function(e) {},
            parseIE: function(e) {},
            parseFIREFOX: function(e) {},
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
            parseCRAPPY: function(e) {}
        };
    }

    Error.prototype.parseError = function parseError(e) {

    };

    window.ErrorParser = ErrorParser;
})();