# Scroll frontend deployment

This fork sends cross-origin credentials only to `https://blockscout-backend.scroll.systems`, including early page prefetches. Other API origins keep their existing credentials behavior. Users must first sign in to the backend Access application; logging in to the frontend alone does not issue the backend cookie. Configure backend Access CORS to allow `https://blockscout.scroll.systems`, credentials, and the frontend request headers, with Cloudflare answering OPTIONS requests.

## Container image

The Build Scroll frontend image workflow uses GitHub-hosted runners and the existing Dockerfile. Pull requests build without publishing. Pushes to main, `scroll-v*` tags, and manual runs publish `ghcr.io/scroll-tech/blockscout-frontend` using GITHUB_TOKEN with packages:write. It does not require the upstream Blockscout runner or ARM runner secrets.

Images are built for linux/amd64. Deploy the immutable `sha-<full commit SHA>` tag, or a `scroll-v*` release tag; the main tag follows main. The main tag is never changed by a manual build on another branch.

Set Helm frontend.image.repository to ghcr.io/scroll-tech/blockscout-frontend and frontend.image.tag to the selected tag after the workflow succeeds. If GHCR creates a private package, configure imagePullSecrets for EKS or make the package public. Keep NEXT_PUBLIC_API_HOST=blockscout-backend.scroll.systems and NEXT_PUBLIC_APP_HOST=blockscout.scroll.systems.

Run the focused credential tests with Node 24: `node --test tests/scroll-access.test.mjs`.
