import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123456", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      realName: "系统管理员",
      role: Role.ADMIN,
      status: true,
      passwordHash
    },
    create: {
      username: "admin",
      realName: "系统管理员",
      role: Role.ADMIN,
      status: true,
      passwordHash
    }
  });

  const failureReasons = ["坩埚破裂", "断丝", "未成相", "数据异常", "设备故障"];
  await Promise.all(
    failureReasons.map((reason, index) =>
      prisma.dictionaryItem.upsert({
        where: {
          dictType_dictValue: {
            dictType: "FAILURE_REASON",
            dictValue: reason
          }
        },
        update: {
          dictLabel: reason,
          sortOrder: index + 1,
          status: true
        },
        create: {
          dictType: "FAILURE_REASON",
          dictLabel: reason,
          dictValue: reason,
          sortOrder: index + 1,
          status: true
        }
      })
    )
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

