import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte.js';
import type { RadioField } from '../index.js';

export type RadioFieldProps = { path: string; config: RadioField; form: DocumentFormContext };
