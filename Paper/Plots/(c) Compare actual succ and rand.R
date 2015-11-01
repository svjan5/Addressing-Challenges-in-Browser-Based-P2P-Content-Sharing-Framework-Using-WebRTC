library(ggplot2)
#setwd("~/Desktop/DTRM")
df <- read.csv("./Data_actual_compare_succ_rand.csv")
df <- df[df$Destpeer_selection=="Successor", ]
df$joinTime <- df$joinTime/10
plot <- ggplot(df, aes(x=n)) +
        #geom_point(aes(y = msg)) +
        geom_line(aes(y = joinTime)) +
        theme_bw() +
        theme(legend.position=c(.15, .8)) + 
        #scale_linetype_manual("Boot peer Selection" ,labels = c("Randomly picked", "Successor"), values = c("dashed", "solid")) +
        ggtitle("C. Time to join network") +
        labs(y = "Join network time (ms)", x = "Number of peers in network") +
        ggsave(file="C_plot.png",  width = 15.875, height=11.985625, units = "cm", dpi=300)

print(plot)

