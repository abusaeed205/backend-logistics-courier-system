
import app from "./app"
import config from "./app/config";
import { prisma } from "./app/lib/prisma";
import { redisclient } from "./app/lib/redis";

const PORT = config.port || 5000


async function main(){
    try{
    await prisma.$connect(); // database url
    await redisclient.connect(); //OTP store env url
    console.log("Redis connected Successfully");
	console.log("Connected to the database successfully.");

        
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

    }catch(error){
        console.error("Error starting the server:", error);
		await prisma.$disconnect();
		process.exit(1);
    }
}



main()