/* eslint-env browser */

import * as Y from 'yjs'
import { WebsocketProvider } from '@adobe/y-websocket';
import { ySyncPlugin, yCursorPlugin, yUndoPlugin, undo, redo, initProseMirrorDoc } from '../src/y-prosemirror.js'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { schema } from './schema.js'
import { exampleSetup } from 'prosemirror-example-setup'
import { keymap } from 'prosemirror-keymap'

// const SERVER = 'https://z21npzmtdj.execute-api.us-east-1.amazonaws.com';
const SERVER = 'http://localhost:8080';

window.addEventListener('load', () => {
  const ydoc = new Y.Doc()
  const provider = new WebsocketProvider(SERVER, 'prod00', ydoc, {
    params: {
      doc: 'test-room'
    },
    protocols: ['yjs', '*'],
    useBase64: true,
    connect: false,
  });
  const type = ydoc.getXmlFragment('prosemirror')

  const editor = document.createElement('div')
  editor.setAttribute('id', 'editor')
  const editorContainer = document.createElement('div')
  editorContainer.insertBefore(editor, null)
  const { doc, mapping } = initProseMirrorDoc(type, schema)
  const prosemirrorView = new EditorView(editor, {
    state: EditorState.create({
      doc,
      schema,
      plugins: [
        ySyncPlugin(type, { mapping }),
        yCursorPlugin(provider.awareness),
        yUndoPlugin(),
        keymap({
          'Mod-z': undo,
          'Mod-y': redo,
          'Mod-Shift-z': redo
        })
      ].concat(exampleSetup({ schema, history: false }))
    })
  })
  document.body.insertBefore(editorContainer, null)

  setTimeout(() => {
    prosemirrorView.focus()
  })

  provider.on('status', (arg) => {
    console.log('status', arg)
    console.log('clientID', provider.doc.clientID);
    document.getElementById('y-status').textContent = `Status: ${arg.status}`;
    document.getElementById('y-user').textContent = `User: ${provider.doc.clientID}`;
  });

  const connectBtn = /** @type {HTMLElement} */ (document.getElementById('y-connect-btn'))
  connectBtn.addEventListener('click', () => {
    if (provider.shouldConnect) {
      provider.disconnect()
      connectBtn.textContent = 'Connect'
    } else {
      provider.connect()
      connectBtn.textContent = 'Disconnect'
    }
  })
  document.getElementById('y-user-name').addEventListener('change', (e) => {
    provider.awareness.setLocalStateField('user', { name: e.target.value });
  });

  document.getElementById('y-auth').addEventListener('change', (e) => {
    provider.protocols = ['yjs', e.target.value]
  });

  // @ts-ignore
  window.example = { provider, ydoc, type, prosemirrorView }
})
