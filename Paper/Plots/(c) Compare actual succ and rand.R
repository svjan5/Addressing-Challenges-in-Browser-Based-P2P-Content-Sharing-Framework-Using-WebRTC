library(ggplot2)
setwd("~/Dropbox/SDN/DTRM/Paper/Plots")
#df <- read.csv("./Data_actual_compare_succ_rand.csv")
#df <- df[df$Destpeer_selection=="Successor", ]
#df$joinTime <- df$joinTime/10

df <- read.csv("./Data_joinTime_actual.csv")
plot <- ggplot(df, aes(x=n)) +
        #geom_point(aes(y = msg)) +
        geom_line(aes(y = joinTime)) +
        theme_bw() +
        theme(legend.position=c(.15, .8)) + 
        scale_x_continuous(breaks = c(0,10,20,30,40,50)) +
        #scale_linetype_manual("Boot peer Selection" ,labels = c("Randomly picked", "Successor"), values = c("dashed", "solid")) +
        #ggtitle("Time to join network") +
        labs(y = "Join network time (ms)", x = "Number of peers in network") +
        ggsave(file="Time to join network.png",  width = 15.875, height=11.985625, units = "cm", dpi=300)

print(plot)

