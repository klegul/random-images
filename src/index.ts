export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		let width = undefined;
		if (url.searchParams.has('width')) {
			width = parseInt(url.searchParams.get('width')!!);
		}

		switch (url.pathname) {
			case '/animal-avatars':
				return getRandomImage(env.ANIMAL_AVATARS, env.ANIMAL_AVATARS_PUBLIC_URL, width);
			default:
				return new Response('Not found', { status: 404 });
		}
	},
} satisfies ExportedHandler<Env>;

async function getRandomImage(bucket: R2Bucket, bucketPublicUrl: string, width?: number): Promise<Response> {
	const listResponse = await bucket.list({ limit: 100 });

	if (!listResponse.objects || listResponse.objects.length === 0) {
		return new Response('No images found', { status: 404 });
	}

	const randomIndex = Math.floor(Math.random() * listResponse.objects.length);
	const randomObject = listResponse.objects[randomIndex];

	let imageTransformString = '';
	if (width) {
		imageTransformString = `/cdn-cgi/image/width=${width}`;
	}

	const imageUrl = `${bucketPublicUrl}${imageTransformString}/${randomObject.key}`;

	return Response.redirect(imageUrl);
}
