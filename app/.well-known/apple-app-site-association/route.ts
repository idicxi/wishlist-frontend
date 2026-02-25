export const dynamic = 'force-static';

export async function GET() {
  // ВАЖНО:
  // - appID должен быть вида "<TEAM_ID>.<BUNDLE_ID>"
  // - BUNDLE_ID в iOS-проекте сейчас: org.reactjs.native.example.WishlistIOS
  // - TEAM_ID нужно заменить на ваш реальный Apple Team ID
  const body = {
    applinks: {
      apps: [],
      details: [
        {
          appID: 'B6APKNTPA4.org.reactjs.native.example.WishlistIOS',
          paths: ['/wishlist/*'],
        },
      ],
    },
  };

  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json',
    },
  });
}

