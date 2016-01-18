library(ggplot2)

setwd("/home/sdnp2p/Dropbox/SDN/DTRM/EC2 Exp/EC2")
df1 <- read.csv("./world_data.csv")

plot <- ggplot(df1, aes(x=n)) + 
        geom_line(aes(y = Join_Time, linetype=Strategy)) +
        scale_shape_identity() +
        geom_point(aes(y = Join_Time, shape = factor(Location), size=5)) +
        scale_x_continuous(breaks = c(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30)) +
        scale_y_continuous(breaks = c(1000,2000,3000,4000,5000,6000,7000)) +
        theme(legend.position=c(.15, .8)) + 
        theme_bw() +
        scale_linetype_manual("Fixfinger Strategy" ,labels = c("Strategy 1", "Strategy 2"), values = c("F1", "twodash")) +
        scale_shape_manual("Location", labels = c( "Oregon","Korea","Ireland","Brazil","Australia","Singapore","Tokyo","North Virginia"), values = c('O','K','I','B','A','S','T','N'))+
        labs(y = "Join network time (ms)", x = "Number of peers in network") 
        #scale_color_manual("Fixfinger Strategy" ,labels = c("Strategy 1", "Strategy 2"), values = c("blue", "red")) +
        #geom_smooth(aes(y = Join_Time, linetype=Strategy)) + 
        #geom_text(aes(y=Join_Time, label=Location, show.legend = TRUE), size=5)+
        #geom_point(aes(x=n, y = Join_Time, alpha=T)) +
        #scale_size_manual("",labels=c(" "), values=c(" ")) +

print(plot)

