describe('error-parser.js', function() {
    describe('ErrorParser', function() {
        describe('#chooseParser', function() {
            var errorParser = new ErrorParser();
            it('should detect V8', function() {
                expect(errorParser.chooseParser(CapturedExceptions.chrome_15)).toBe(errorParser.parseV8);
            });
        });
    });

//    describe('Map::merge', function() {
//        it('should throw an Error if input is not a Map', function() {
//            var expectedError = new TypeError('Cannot merge with objects that are not Maps');
//            expect(function() { new Map().merge() }).toThrow(expectedError);
//        });
//
//        it('should handle empty maps', function() {
//            var map = new Map();
//            var mergedMap = map.merge(new Map());
//            expect(mergedMap.keys().length).toBe(0);
//        });
//    });
});
