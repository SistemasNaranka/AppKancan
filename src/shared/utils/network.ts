export function resolveNetworkUrl(url: string | undefined): string {
	if (!url) return '';

	if (typeof window === 'undefined') return url;

	const hostname = window.location.hostname;

	const localDirectusUrl = import.meta.env.VITE_DIRECTUS_URL;
	const externalDirectusUrl = import.meta.env.VITE_DIRECTUS_URL_EXTERNAL;
	const localWebhookUrl = import.meta.env.VITE_WEBHOOK_URL_TRASLADOS;
	const externalWebhookHost = import.meta.env.VITE_WEBHOOK_HOST_EXTERNAL;

	let localSubnet = '';
	let localDirectusOrigin = '';
	let externalDirectusOrigin = '';
	let localWebhookOrigin = '';
	let externalWebhookOrigin = '';

	if (localDirectusUrl) {
		try {
			const parsedLocal = new URL(localDirectusUrl);
			localDirectusOrigin = parsedLocal.origin;

			const ipMatch = parsedLocal.hostname.match(/^(\d+\.\d+\.\d+\.)/);
			localSubnet = ipMatch ? ipMatch[1] : parsedLocal.hostname;
		} catch (e) {
			console.warn('Error parsing VITE_DIRECTUS_URL in resolveNetworkUrl:', e);
		}
	}

	if (externalDirectusUrl) {
		try {
			externalDirectusOrigin = new URL(externalDirectusUrl).origin;
		} catch (e) {
			console.warn(
				'Error parsing VITE_DIRECTUS_URL_EXTERNAL in resolveNetworkUrl:',
				e,
			);
		}
	}

	if (localWebhookUrl && externalWebhookHost) {
		try {
			const parsedWebhook = new URL(localWebhookUrl);
			localWebhookOrigin = parsedWebhook.origin;

			const externalWebhookUrl = /^https?:\/\//i.test(externalWebhookHost)
				? externalWebhookHost
				: `${parsedWebhook.protocol}//${externalWebhookHost}`;
			externalWebhookOrigin = new URL(externalWebhookUrl).origin;
		} catch (e) {
			console.warn('Error parsing webhook URLs in resolveNetworkUrl:', e);
		}
	}

	const isLocal =
		hostname === 'localhost' ||
		hostname === '127.0.0.1' ||
		(localSubnet && hostname.startsWith(localSubnet));

	if (isLocal) {
		return url;
	}

	const resolved = url.trim();

	let parsedUrl: URL;
	try {
		parsedUrl = new URL(resolved);
	} catch {
		return resolved;
	}

	if (
		localDirectusOrigin &&
		externalDirectusOrigin &&
		parsedUrl.origin === localDirectusOrigin
	) {
		const externalOrigin = new URL(externalDirectusOrigin);
		parsedUrl.protocol = externalOrigin.protocol;
		parsedUrl.host = externalOrigin.host;
	}

	if (
		localWebhookOrigin &&
		externalWebhookOrigin &&
		parsedUrl.origin === localWebhookOrigin
	) {
		const externalOrigin = new URL(externalWebhookOrigin);
		parsedUrl.protocol = externalOrigin.protocol;
		parsedUrl.host = externalOrigin.host;
	}

	return parsedUrl.toString();
}
