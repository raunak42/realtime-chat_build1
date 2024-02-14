import ChatInput from "@/components/ChatInput";
import Messages from "@/components/Messages";
import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { messageArrayValidator } from "@/lib/validations/message";
import { getServerSession } from "next-auth";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FC } from "react";

interface pageProps {
  params: {
    chatId: string; // this name has to be same as the parent folder, here, [chatId]
  };
}

async function getChatMessages(chatId: string) {
  try {
    const results: string[] = await fetchRedis(
      "zrange",
      `chat:${chatId}:messages`,
      0,
      -1
    );

    const dbMessages = results.map((message) => JSON.parse(message) as Message);

    const reversedDbMessages = dbMessages.reverse();

    const messages = messageArrayValidator.parse(reversedDbMessages);

    return messages;
  } catch (error) {
    notFound();
  }
}

const page: FC<pageProps> = async ({ params }: pageProps) => {
  const { chatId } = params;
  const session = await getServerSession(authOptions);
  if (!session) notFound();

  const { user } = session;
  const [userId1, userId2] = chatId.split("--");

  if (user.id !== userId1 && user.id !== userId2) {
    notFound();
  }

  const chatPartnerId = user.id === userId1 ? userId2 : userId1;
  const chatPartner = (await fetchRedis(
    "get",
    `user:${chatPartnerId}`
  )) as string;

  const chatPartnerParsed = JSON.parse(chatPartner) as User;
  const initialMessages = await getChatMessages(chatId);
  return (
    <div className="flex-1 justify-between flex flex-col h-full max-h-[calc(100vh-6rem)]">
      <div className="flex sm:items-center justify-between py-3 border-b-2 border-gray-200">
        <div className="relative flex items-center space-x-4">
          <div className="relative">
            <div className="relative w-8 sm:w-12 h-8 sm:h-12">
              <Image
                fill
                referrerPolicy="no-referrer"
                src={chatPartnerParsed.image}
                alt={`${chatPartnerParsed.name} profile picture`}
                className="rounded-full"
              />
            </div>
          </div>

          <div className="flex flex-col leading-tight">
            <div className="text-xl flex items-center">
              <span className="text-gray-700 mr-3 font-semibold">
                {chatPartnerParsed.name}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {chatPartnerParsed.email}
            </span>
          </div>
        </div>
      </div>

      <Messages
        chatId={chatId}
        sessionImg={session.user.image}
        chatPartner={chatPartnerParsed}
        initialMessages={initialMessages}
        sessionId={session.user.id}
      />
      <ChatInput chatPartner={chatPartnerParsed} chatId={chatId} />
    </div>
  );
};

export default page;
