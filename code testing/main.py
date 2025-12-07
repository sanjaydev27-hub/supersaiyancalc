#!/usr/bin/env python3
"""Simple project calculator: safe expression evaluator + interactive REPL.

Usage:
  - Run with an expression argument to evaluate once:
	  python main.py "2+2*3"
  - Run without arguments to start interactive REPL:
	  python main.py

The evaluator uses ast to allow only numeric literals, unary and binary
operators (+, -, *, /, %, //, **) to avoid executing arbitrary code.
"""

import ast
import operator as op
import sys


class SafeEvaluator(ast.NodeVisitor):
	"""Evaluate a math expression safely using AST."""

	# supported binary operators
	_binops = {
		ast.Add: op.add,
		ast.Sub: op.sub,
		ast.Mult: op.mul,
		ast.Div: op.truediv,
		ast.Mod: op.mod,
		ast.FloorDiv: op.floordiv,
		ast.Pow: op.pow,
	}

	# supported unary operators
	_unops = {
		ast.UAdd: lambda x: x,
		ast.USub: op.neg,
	}

	def visit(self, node):
		method = 'visit_' + node.__class__.__name__
		visitor = getattr(self, method, None)
		if visitor is None:
			raise ValueError(f"Unsupported expression: {node.__class__.__name__}")
		return visitor(node)

	def visit_Expression(self, node):
		return self.visit(node.body)

	def visit_BinOp(self, node):
		left = self.visit(node.left)
		right = self.visit(node.right)
		op_type = type(node.op)
		if op_type in self._binops:
			return self._binops[op_type](left, right)
		raise ValueError(f"Unsupported binary operator: {op_type.__name__}")

	def visit_UnaryOp(self, node):
		operand = self.visit(node.operand)
		op_type = type(node.op)
		if op_type in self._unops:
			return self._unops[op_type](operand)
		raise ValueError(f"Unsupported unary operator: {op_type.__name__}")

	def visit_Num(self, node):  # for Python <3.8
		return node.n

	def visit_Constant(self, node):  # Python 3.8+
		if isinstance(node.value, (int, float)):
			return node.value
		raise ValueError(f"Unsupported constant: {node.value!r}")

	def generic_visit(self, node):
		raise ValueError(f"Unsupported node: {node.__class__.__name__}")


def safe_eval(expr: str):
	"""Safely evaluate a math expression string and return a number.

	Raises ValueError on unsupported syntax or operations.
	"""
	try:
		parsed = ast.parse(expr, mode='eval')
	except SyntaxError as exc:
		raise ValueError(f"Syntax error in expression: {exc}")
	evaluator = SafeEvaluator()
	return evaluator.visit(parsed)


def repl():
	print("Simple calculator — type an expression, or 'quit' to exit.")
	print("Commands: quit, exit, history, help")
	history = []
	while True:
		try:
			line = input('calc> ').strip()
		except (EOFError, KeyboardInterrupt):
			print()
			break
		if not line:
			continue
		if line.lower() in ('quit', 'exit'):
			break
		if line.lower() == 'help':
			print("Enter arithmetic expressions using + - * / % // ** and parentheses.")
			continue
		if line.lower() == 'history':
			for i, (expr, res) in enumerate(history, 1):
				print(f"{i}: {expr} = {res}")
			continue
		try:
			result = safe_eval(line)
		except Exception as exc:
			print(f"Error: {exc}")
			continue
		print(result)
		history.append((line, result))


def main():
	if len(sys.argv) > 1:
		expr = ' '.join(sys.argv[1:])
		try:
			result = safe_eval(expr)
		except Exception as exc:
			print(f"Error: {exc}")
			sys.exit(2)
		print(result)
		return
	repl()


if __name__ == '__main__':
	main()

 