export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		let width = undefined;
		if (url.searchParams.has('width')) {
			width = parseInt(url.searchParams.get('width')!!);
		}

		let bucket: R2Bucket;
		let bucketPublicUrl: string;

		switch (url.pathname.split('.json')[0]) {
			case '/animal-avatars':
				bucket = env.ANIMAL_AVATARS;
				bucketPublicUrl = env.ANIMAL_AVATARS_PUBLIC_URL;
				break;
			default:
				return new Response('Not found', { status: 404 });
		}

		const imageUrl = await getRandomImage(bucket, bucketPublicUrl, width);
		if (!imageUrl) {
			return new Response('No images found', { status: 404 });
		}

		if (url.pathname.endsWith('.json')) {
			return new Response(
				JSON.stringify({
					url: imageUrl,
				}),
				{ headers: { 'Content-Type': 'application/json' } },
			);
		}

		return Response.redirect(imageUrl);
	},
} satisfies ExportedHandler<Env>;

async function getRandomImage(bucket: R2Bucket, bucketPublicUrl: string, width?: number): Promise<string | undefined> {
	const listResponse = await bucket.list({ limit: 100 });

	if (!listResponse.objects || listResponse.objects.length === 0) {
		return undefined;
	}

	const randomIndex = Math.floor(Math.random() * listResponse.objects.length);
	const randomObject = listResponse.objects[randomIndex];

	let imageTransformString = '';
	if (width) {
		imageTransformString = `/cdn-cgi/image/width=${width}`;
	}

	return `${bucketPublicUrl}${imageTransformString}/${randomObject.key}`;
}
