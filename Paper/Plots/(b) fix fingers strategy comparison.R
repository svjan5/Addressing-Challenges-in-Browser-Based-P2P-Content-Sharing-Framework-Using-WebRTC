library(ggplot2)
setwd("~/Dropbox/SDN/DTRM/Paper/Plots")
df <- read.csv("./Data_fix_fingers.csv")


plot <- ggplot(df, aes(x=n)) +
        #geom_point(aes(y = msg)) +
        geom_line(aes(y = msg, linetype=Strategy)) +
        theme_bw() +
        theme(legend.position=c(.15, .8)) + 
        scale_linetype_manual("Fixfinger Strategy" ,labels = c("Strategy 1", "Strategy 2"), values = c("dashed", "solid")) +
        ggtitle("Comparing strategies for periodic fix fingers operation") +
        labs(y = "Number of messages exchanged", x = "Number of peers in network") +
        ggsave(file="B_plot.png",  width = 15.875, height=11.985625, units = "cm", dpi=300)

print(plot)
