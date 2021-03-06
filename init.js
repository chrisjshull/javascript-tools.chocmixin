/*!
 * JavaScript tools mixin for Chocolat
 * Copyright(c) 2012 Nicholas Penree <nick@penree.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var spawn = require('child_process').spawn
  , vm = require('vm')
  , util = require('util')
  , jsbeautify = require('./jsbeautify');

/**
 * Hook up menu items.
 */

Hooks.addMenuItem('Text/Lines/Convert to JS Array', 'control-shift-a', function() {
  Recipe.run(function(recipe) {
    var sel = (!recipe.selection.length)? new Range(0, recipe.length) : recipe.selection
      , output = '[ '
      , text = recipe.textInRange(sel)
      , lines = text.split(/\r\n|\n|\r/) || []
      , count = lines.length
      , current = 0;

    lines.forEach(function(line) {
      output += "'" + line.trimRight().replace("'", "\\'") + "'";

      current++;
      if (current < count) {
        output += ', ';
      }
    });

    output += ' ]';

    recipe.replaceTextInRange(sel, output);
  });
});

Hooks.addMenuItem('Text/Lines/Convert to JS String', 'control-shift-s', function() {
  Recipe.run(function(recipe) {
    var sel = (!recipe.selection.length)? new Range(0, recipe.length) : recipe.selection
      , output = ''
      , text = recipe.textInRange(sel)
      , lines = text.split(/\r\n|\n|\r/) || []
      , count = lines.length
      , current = 0;

    lines.forEach(function(line) {
      output += "'" + line.trimRight().replace("'", "\\'") + "\\n'";

      current++;
      if (current < count) {
        output += ' +\n';
      }
    });

    recipe.replaceTextInRange(sel, output);
  });
});

Hooks.addMenuItem('Actions/JSON/Pretty Format JSON', 'control-shift-j', function() {
  var type = Document.current().rootScope();

  if (~['json.source', 'plain.text'].indexOf(type)) {
    Recipe.run(function(recipe) {
      var sel = (!recipe.selection.length)? new Range(0, recipe.length) : recipe.selection
        , output = ''
        , text = recipe.textInRange(sel);

      try {
        output = JSON.stringify(JSON.parse(text), null, '  '); 
      } catch (e) {
        output = null;
      } finally {
        if (output) {
          recipe.replaceTextInRange(sel, output);
        }
      }
    });
  }
});

Hooks.addMenuItem('Actions/JavaScript/Pretty Format JavaScript', 'control-shift-k', function() {
  var type = Document.current().rootScope();

  if (type === 'js.source') {
    Recipe.run(function(recipe) {
      var sel = (!recipe.selection.length)? new Range(0, recipe.length) : recipe.selection
        , output = ''
        , text = recipe.textInRange(sel);

      try {
        output = jsbeautify(text, { indent_size: 2, indent_char: ' ' }); 
      } catch (e) {
        output = null;
      } finally {
        if (output) {
          recipe.replaceTextInRange(sel, output);
        }
      }
    });
  }
});

Hooks.addMenuItem('Actions/JavaScript/JSONify', 'command-control-shift-s', function() {
  var type = Document.current().rootScope();

  if (type === 'js.source') {
    Recipe.run(function(recipe) {
      var sel = (!recipe.selection.length)? new Range(0, recipe.length) : recipe.selection
        , output = ''
        , text = recipe.textInRange(sel);

      var context = {};
      
      try {
        //hackity hack, don't talk back
        vm.runInNewContext('var output = ' + text, context, 'selection on line');
        if (context.output) output = JSON.stringify(context.output); 
      } catch (e) {
        output = null;
      } finally {
        if (output) {
          recipe.replaceTextInRange(sel, output);
        }
      }
    });
  }
})

Hooks.addMenuItem('Actions/JavaScript/Evaluate JavaScript to Document', 'control-shift-r', function() {
  Recipe.run(function(recipe) {
    var sel = recipe.selection;

    if (sel.length) {
      var output = []
        , text = recipe.textInRange(sel)
        , context = {
            process: process
          , console: {
            log: function() {
              output.push(util.format.apply(this, arguments));
            }
          }
         };

      try {
        vm.runInNewContext(text, context, 'selection on line');

        if (output.length) {
          recipe.replaceTextInRange(sel, output.join('\n'));
        }
      } catch(e) {
        var lines = e.stack.split('\n')
          , stack = '';

        if (lines.length >= 2) {
          stack = lines[0] + '\n' + lines[1];
        }

        Alert.show(e.message, stack, ['OK']);
      }
    }
  });
});