import { useState } from "react";
import { ArrowLeft, Search, Phone, MoreVertical } from "lucide-react";
import { CustomerNav } from "../../components/CustomerNav";

export function CustomerMessages() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);

  // Mock data for messages
  const conversations = [
    {
      id: 1,
      name: "Driver Juan",
      avatar: "J",
      lastMessage: "I'm on my way to your location",
      time: "2 min ago",
      unread: 0,
      phone: "+63 912 345 6789"
    },
    {
      id: 2,
      name: "Driver Maria",
      avatar: "M", 
      lastMessage: "Thank you for riding with me!",
      time: "1 hour ago",
      unread: 0,
      phone: "+63 913 456 7890"
    },
    {
      id: 3,
      name: "Driver Carlos",
      avatar: "C",
      lastMessage: "Your ride has been completed",
      time: "Yesterday",
      unread: 1,
      phone: "+63 914 567 8901"
    }
  ];

  const selectedConversation = conversations.find(c => c.id === selectedChat);

  if (selectedChat !== null && selectedConversation) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Chat Header */}
        <div className="flex items-center gap-3 bg-white border-b border-gray-100 px-4 py-3">
          <button 
            onClick={() => setSelectedChat(null)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="w-10 h-10 bg-[#F47920] rounded-full flex items-center justify-center text-white font-bold">
            {selectedConversation.avatar}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{selectedConversation.name}</h3>
            <p className="text-xs text-gray-500">Driver</p>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <Phone className="w-4 h-4 text-gray-600" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="space-y-4">
            <div className="flex justify-start">
              <div className="max-w-[70%] bg-white rounded-2xl rounded-tl-none px-4 py-2 shadow-sm">
                <p className="text-sm text-gray-800">I'm arriving at your pickup location</p>
                <p className="text-xs text-gray-400 mt-1">2 min ago</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[70%] bg-[#F47920] text-white rounded-2xl rounded-tr-none px-4 py-2">
                <p className="text-sm">I'm waiting outside</p>
                <p className="text-xs text-orange-100 mt-1">1 min ago</p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[70%] bg-white rounded-2xl rounded-tl-none px-4 py-2 shadow-sm">
                <p className="text-sm text-gray-800">I'm on my way to your location</p>
                <p className="text-xs text-gray-400 mt-1">2 min ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-100 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#F47920]"
            />
            <button className="w-8 h-8 bg-[#F47920] rounded-full flex items-center justify-center text-white">
              <span className="text-sm">Send</span>
            </button>
          </div>
        </div>
        
        {/* Bottom Nav */}
        <div className="absolute bottom-0 left-0 right-0">
          <CustomerNav />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <h2 className="text-lg font-bold text-gray-800">Messages</h2>
      </div>

      {/* Search Bar */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => setSelectedChat(conversation.id)}
            className="w-full bg-white border-b border-gray-50 px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <div className="w-12 h-12 bg-[#F47920] rounded-full flex items-center justify-center text-white font-bold">
              {conversation.avatar}
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">{conversation.name}</h3>
                <span className="text-xs text-gray-400">{conversation.time}</span>
              </div>
              <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
            </div>
            {conversation.unread > 0 && (
              <div className="w-5 h-5 bg-[#F47920] rounded-full flex items-center justify-center text-white text-xs font-bold">
                {conversation.unread}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
