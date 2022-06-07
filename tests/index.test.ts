import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { traverse } from '@babel/core'
import generate from '@babel/generator'
import { parse } from '@babel/parser'
import main from '../src/index'


test('index', async () => {
   await testOnlyIf()
   await testIfAndElse()
})

test.run()


async function assertTransform(src, expectedOutput, message, shouldLog = false) {
	const ast = parse(
		src,
		{ 
			sourceType: "module",
			plugins: [ "jsx" ]
		}
	)
	
	traverse(
		ast,
		main().visitor
	)
	
	const res = generate(ast)

	if (shouldLog) console.log(res.code)

	assert.snapshot(res.code, expectedOutput, message)
}


// Only <If> without <Else>
async function testOnlyIf() {
	const src =
/*javascript*/`import { If } from 'babel-plugin-solid-if-component';
<>
	<If cond={hello}>
		<div>Hello</div>
	</If>
</>`

	const expectedOutput =
/*javascript*/`import { Show as _Show } from "solid-js";
<>
	<_Show when={hello}>
		<div>Hello</div>
	</_Show>
</>;`

	await assertTransform(src, expectedOutput, 'Only <If> without <Else>')
}

// <If> and <Else>
async function testIfAndElse() {
	const src =
/*javascript*/`import { If, Else } from 'babel-plugin-solid-if-component';
<>
	<If cond={hello}>
		<div>Hello</div>
	</If>
	<Else>
		<div>Goodbye</div>
	</Else>
</>`

	const expectedOutput =
`import { Show as _Show } from "solid-js";
<>
	<_Show when={hello} fallback=<>
		<div>Goodbye</div>
	</>>
		<div>Hello</div>
	</_Show>
	
</>;`

	await assertTransform(src, expectedOutput, '<If> and <Else>')
}
