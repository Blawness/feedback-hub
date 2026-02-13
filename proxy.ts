import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    const session = await auth();
    const isAuthPage = request.nextUrl.pathname.startsWith("/login");
    const isApiRoute = request.nextUrl.pathname.startsWith("/api");

    if (!session && !isAuthPage && !isApiRoute) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (session && isAuthPage) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
