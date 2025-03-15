import Image from "next/image"

export function HeroSection() {
  return (
    <div className="relative h-[200px] bg-[#1a1a1a]">
      <div className="absolute inset-0">
        <Image
          src="https://robohash.org/characters?size=1200x200&set=set2"
          alt="Hero background"
          width={1200}
          height={200}
          className="w-full h-full object-cover opacity-10"
        />
      </div>
      <div className="relative h-full flex items-center px-8">
        <div className="max-w-xl">
          <div className="text-sm text-gray-500 mb-1">What do you want to do today?</div>
          <h1 className="text-2xl font-medium text-white mb-2">Chat with your favorite characters</h1>
          <p className="text-sm text-gray-400">
            Talk to Harry Potter, Chota Bheem, or create your own video character!
          </p>
        </div>
      </div>
    </div>
  )
}
