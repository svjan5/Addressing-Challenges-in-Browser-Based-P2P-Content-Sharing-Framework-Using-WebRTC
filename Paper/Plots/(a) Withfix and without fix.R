library(ggplot2)
 #setwd("~/Desktop")
setwd("/media/shikhar/New Volume/Dropbox/Dropbox/LAB_6021/DTRM/Paper/Plots")
df <- read.csv("data_cmp.csv")

plot <- ggplot(df, aes(x=n)) +
        geom_point(aes(y = msg)) +
        geom_line(aes(y = msg, linetype=type)) +
        theme_bw() +
        scale_x_continuous(breaks = c(1,2,4,8,16,32)) +
        scale_y_continuous(breaks = c(10,20,30,40,50,60)) +
        theme(legend.position = c(.2, .8)) + 
        #scale_linetype_discrete(name = "Fancy Title", values = c("logn""O(log n)", )) +
        scale_linetype_manual("Scenarios" ,labels = c("With fingers: O(log n)", "Without fingers: O(n)"), values = c("F1", "twodash")) +
        #ggtitle("Performance of join network operation") +
        labs(y = "Number of messages exchanged", x = "Number of peers in network")+
        ggsave(file="Performance of join network operation.png",  width = 15.875, height=11.985625, units = "cm", dpi=300)

print(plot)

