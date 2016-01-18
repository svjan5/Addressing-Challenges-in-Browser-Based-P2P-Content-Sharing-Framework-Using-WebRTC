library(ggplot2)

setwd("/home/sdnp2p/Dropbox/SDN/DTRM/EC2 Exp/EC2")
df1 <- read.csv("./Data_compare_wan_lan.csv")

#scolor <- lapply(color, )


plot <- ggplot(df1, aes(x=n)) + 
        geom_line(aes(y = Join_Time, linetype=type)) +
        #geom_point(aes(x=n, y = Join_Time, alpha=T)) +
        #geom_smooth(aes(y = Join_Time, linetype=Strategy)) + 
        #geom_text(aes(y=Join_Time, label=Location, show.legend = TRUE), size=5)+
        scale_x_continuous(breaks = c(2,6,10,14,18,22,26,30)) +
        scale_y_continuous(breaks = c(1000,2000,3000,4000,5000,6000,7000)) +
        theme_bw() +
        theme(legend.position=c(.1, .875)) +
        #scale_color_manual("Fixfinger Strategy" ,labels = c("Strategy 1", "Strategy 2"), values = c("blue", "red")) +
        scale_linetype_manual("Network Scenarios" ,labels = c("LAN", "Internet"), values = c("F1", "twodash")) +
        #scale_size_manual("",labels=c(" "), values=c(" ")) +
        labs(y = "Join network time (ms)", x = "Number of peers in network") 
        #ggsave(file="compare_plot_2.png",   units = "cm", dpi=300)

print(plot)

