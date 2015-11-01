library(ggplot2)
#setwd("~/Dropbox/SDN/DTRM/Paper/Plots")
df <- read.csv("./Data_nofix_withDelay.csv")
df$joinTime <- df$joinTime/10
plot <- ggplot(df, aes(x=n)) +
        #geom_point(aes(y = msg)) +
        geom_line(aes(y = msg, linetype=strategy)) +
        theme_bw() +
        theme(legend.position = c(.2, .8)) + 
        scale_linetype_manual("FindSuccesor Strategy" ,labels = c("Strategy 1", "Strategy 2"), values = c("dashed", "solid")) +
        ggtitle("Comparing find successor strategies") +
        labs(y = "Number of messages exchanged", x = "Number of peers in network") + 
        ggsave(file="E_plot.png",  width = 15.875, height=11.985625, units = "cm", dpi=300)

print(plot)


library(ggplot2)
#setwd("~/Dropbox/SDN/DTRM/Paper/Plots")
df <- read.csv("./Data_nofix_withDelay.csv")
df$joinTime <- df$joinTime/10
plot <- ggplot(df, aes(x=n)) +
        #geom_point(aes(y = msg)) +
        geom_line(aes(y = joinTime, linetype=strategy)) +
        theme_bw() +
        theme(legend.position = c(.2, .8)) + 
        scale_linetype_manual("FindSuccesor Strategy" ,labels = c("Strategy 1", "Strategy 2"), values = c("dashed", "solid")) +
        ggtitle("Comparing find successor strategies") +
        labs(y = "Join network time (ms)", x = "Number of peers in network") + 
        ggsave(file="E2_plot.png",  width = 15.875, height=11.985625, units = "cm", dpi=300)

print(plot)


