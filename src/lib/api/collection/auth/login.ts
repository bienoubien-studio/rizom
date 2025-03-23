import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from 'rizom/errors/handler.server.js';
import type { PrototypeSlug } from 'rizom/types/doc.js';
import { safe } from 'rizom/util/safe.js';

export default function (slug: PrototypeSlug) {
	//
	async function POST(event: RequestEvent) {
		const { rizom } = event.locals;
		const data = await event.request.json();
		const { email, password } = data;

		const [error, success] = await safe(rizom.auth.login({ email, password, slug }));
		if (error) {
			return handleError(error, { context: 'api' });
		}

		const headers = { 'set-auth-token': success.token };
		return json({ user: success.user }, { headers });
	}

	return POST;
}
