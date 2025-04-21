import discord
from discord.ext import commands, tasks
import docker
import asyncio
from datetime import datetime, timedelta

TOKEN = "YOUR_DISCORD_BOT_TOKEN"
ADMIN_ID = 1134000714612477963

bot = commands.Bot(command_prefix="/", intents=discord.Intents.all())
client = docker.from_env()

vps_data = {}
coins = {}

@bot.event
async def on_ready():
    print(f"Bot is online as {bot.user}")
    check_expired.start()

def create_vps(username, ram):
    container = client.containers.run(
        "rastasheep/ubuntu-sshd:latest",
        detach=True,
        mem_limit=f"{ram}g",
        ports={'22/tcp': None},
        name=f"vps_{username}_{int(datetime.now().timestamp())}",
        tty=True
    )
    ip = "your.vps.ip"  # Replace with your server's IP
    port = container.attrs['NetworkSettings']['Ports']['22/tcp'][0]['HostPort']
    return container.id, ip, port

@bot.slash_command(name="deploy", description="Deploy a VPS (1-64GB)")
async def deploy(ctx, ram: int):
    user = ctx.author
    if user.id != ADMIN_ID and (ram < 1 or ram > 64):
        return await ctx.respond("You can only deploy between 1 and 64GB.")
    
    if user.id in vps_data:
        return await ctx.respond("You already have a VPS.")

    container_id, ip, port = create_vps(user.name, ram)
    vps_data[user.id] = {
        "container_id": container_id,
        "expires": datetime.now() + timedelta(days=30),
        "ram": ram,
        "ip": ip,
        "port": port
    }
    coins[user.id] = coins.get(user.id, 0)

    await ctx.respond(f"VPS deployed!\nIP: `{ip}`\nPort: `{port}`\nUser: `root`\nPass: `root`")

@bot.slash_command(name="renew", description="Renew your VPS for 10 coins")
async def renew(ctx):
    if ctx.author.id not in vps_data:
        return await ctx.respond("You don't have a VPS.")
    if coins.get(ctx.author.id, 0) < 10:
        return await ctx.respond("You need at least 10 coins to renew.")
    
    vps_data[ctx.author.id]["expires"] += timedelta(days=30)
    coins[ctx.author.id] -= 10
    await ctx.respond("Your VPS has been renewed for 30 more days.")

@bot.slash_command(name="coins", description="Check your coin balance")
async def show_coins(ctx):
    balance = coins.get(ctx.author.id, 0)
    await ctx.respond(f"You have {balance} coins.")

@bot.slash_command(name="addcoins", description="(Admin only) Give coins to user")
async def addcoins(ctx, member: discord.Member, amount: int):
    if ctx.author.id != ADMIN_ID:
        return await ctx.respond("Only admins can use this.")
    coins[member.id] = coins.get(member.id, 0) + amount
    await ctx.respond(f"Gave {amount} coins to {member.name}.")

@bot.slash_command(name="myvps", description="Get your VPS details")
async def myvps(ctx):
    vps = vps_data.get(ctx.author.id)
    if not vps:
        return await ctx.respond("No VPS found.")
    await ctx.respond(f"RAM: {vps['ram']}GB\nIP: {vps['ip']}:{vps['port']}\nExpires: {vps['expires']}")

@bot.slash_command(name="help", description="Show all commands")
async def help_cmd(ctx):
    await ctx.respond("""
**Available Commands:**
/deploy <ram> - Deploy VPS
/renew - Renew VPS (10 coins)
/myvps - Show your VPS info
/coins - Show your coin balance
/addcoins <user> <amount> - Admin only
/help - Show this message
""")

@tasks.loop(minutes=1)
async def check_expired():
    now = datetime.now()
    for uid, data in list(vps_data.items()):
        if now >= data["expires"]:
            try:
                container = client.containers.get(data["container_id"])
                container.stop()
                container.remove()
            except:
                pass
            del vps_data[uid]

bot.run(TOKEN)
