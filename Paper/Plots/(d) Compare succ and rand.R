library(ggplot2)
#setwd("~/Desktop/DTRM")
df <- read.csv("./Data_compare_succ_ran.csv")

plot <- ggplot(df, aes(x=n)) +
        #geom_point(aes(y = msg)) +
        geom_line(aes(y = joinTime, linetype=Destpeer_selection)) +
        theme_bw() +
        theme(legend.position = c(.15, .8)) + 
        scale_linetype_manual("Boot peer Selection" ,labels = c("Randomly picked", "Successor"), values = c("dashed", "solid")) +
        ggtitle("Strategies of recommending Boot peer ") +
        labs(y = "Join network time (ms)", x = "Number of peers in network") +
        ggsave(file="D_plot.png",  width = 15.875, height=11.985625, units = "cm", dpi=300)

print(plot)