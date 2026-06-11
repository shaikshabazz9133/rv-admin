/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: process.env.NEXT_PUBLIC_S3_HOSTNAME ?? "rv-adventure-master-staging.s3.ap-southeast-2.amazonaws.com",
			},
			{
				protocol: "https",
				hostname: new URL(process.env.NEXT_PUBLIC_IMG_BASE ?? "https://dev-backend.rvadventureaustralia.com.au").hostname,
			},
		],
	},
};

export default nextConfig;
