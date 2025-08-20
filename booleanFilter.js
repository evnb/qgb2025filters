// Lightweight Boolean filter parser for tags
function parseBooleanQuery(query) {
    // Tokenize (AND, OR, NOT, parentheses, quoted strings, words)
    const tokens = query.match(/"[^"]+"|\(|\)|AND|OR|NOT|\S+/gi) || [];
    let i = 0;
  
    function parseExpr() {
      let node = parseTerm();
      while (tokens[i] && tokens[i].toUpperCase() === 'OR') {
        i++;
        node = { type: 'or', left: node, right: parseTerm() };
      }
      return node;
    }
  
    function parseTerm() {
      let node = parseFactor();
      while (tokens[i] && tokens[i].toUpperCase() === 'AND') {
        i++;
        node = { type: 'and', left: node, right: parseFactor() };
      }
      return node;
    }
  
    function parseFactor() {
      const token = tokens[i++];
      if (!token) return { type: 'literal', value: '' };
  
      if (token === '(') {
        const expr = parseExpr();
        i++; // skip ')'
        return expr;
      }
      if (token.toUpperCase() === 'NOT') {
        return { type: 'not', value: parseFactor() };
      }
      return {
        type: 'literal',
        value: token.replace(/^"|"$/g, '').toLowerCase()
      };
    }
  
    return parseExpr();
  }
  
  function evaluateAST(ast, tags) {
    tags = tags.map(t => t.toLowerCase());
    switch (ast.type) {
      case 'literal':
        return tags.includes(ast.value);
      case 'not':
        return !evaluateAST(ast.value, tags);
      case 'and':
        return evaluateAST(ast.left, tags) && evaluateAST(ast.right, tags);
      case 'or':
        return evaluateAST(ast.left, tags) || evaluateAST(ast.right, tags);
      default:
        return true;
    }
  }
  