import CommentsSection from "@/components/CommentsSection";
import EditorOutput from "@/components/EditorOutput";
import PostVoteServer from "@/components/post-vote/PostVoteServer";
import { buttonVariants } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { formatTimeToNow } from "@/lib/utils";
import { Comment, Post, User, Vote } from "@prisma/client";
import { ArrowBigDown, ArrowBigUp, Loader2, MessageSquare } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type pageProps = {
  params: {
    postId: string;
  };
};

const page = async ({ params }: pageProps) => {
  const cachedPost: any = null;

  let post:
    | (Post & { votes: Vote[]; author: User; comments: Comment[] })
    | null = null;

  if (!cachedPost) {
    post = await db.post.findFirst({
      where: {
        id: params.postId,
      },
      include: {
        votes: true,
        author: true,
        comments: true,
      },
    });
  }

  if (!post && !cachedPost) return notFound();

  return (
    <div>
      <div className="shadow-md h-full flex flex-col sm:flex-row items-center sm:items-start justify-between border-[1px] border-gray-200 rounded-sm">
        <div className="sm:w-0 w-full flex-1 bg-white p-4 rounded-sm">
          <p className="max-h-40 mt-1 truncate text-xs text-gray-500 flex items-center">
            Post by u/{post?.author.username! ?? cachedPost?.authorUsername}
            <span className="ml-2">
              {formatTimeToNow(
                new Date(post?.createdAt! ?? cachedPost?.createdAt)
              )}
            </span>
          </p>
          <h1 className="text-xl font-semibold py-2 leading-6 text-gray-900">
            {post?.title! ?? cachedPost?.title}
          </h1>

          <EditorOutput content={post?.content! ?? cachedPost?.content} />

          <div className="flex justify-start mt-6 gap-3">
            <Suspense fallback={<PostVoteShell />}>
              <PostVoteServer
                postId={post?.id! ?? cachedPost?.id}
                getData={async () => {
                  return await db.post.findUnique({
                    where: {
                      id: params.postId,
                    },
                    include: { votes: true },
                  });
                }}
              />
            </Suspense>
            <div className="w-fit flex items-center gap-2 bg-[#e5ebee] rounded-full px-3">
              <MessageSquare className="h-4 w-4" />
              {post?.comments.length! ?? cachedPost?.commentsAmt}
            </div>
          </div>

          <Suspense
            fallback={
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            }
          >
            <CommentsSection postId={post?.id! ?? cachedPost?.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

function PostVoteShell() {
  return (
    <div className="flex bg-[#e5ebee] rounded-full text-black items-center">
      <div className={buttonVariants({ variant: "ghost" })}>
        <ArrowBigUp className="h-5 w-5 text-zinc-700" />
      </div>

      <div className="text-center py-2 font-medium text-sm text-zinc-900">
        <Loader2 className="h-3 w-3 animate-spin" />
      </div>

      <div className={buttonVariants({ variant: "ghost" })}>
        <ArrowBigDown className="h-5 w-5 text-zinc-700" />
      </div>
    </div>
  );
}

export default page;
