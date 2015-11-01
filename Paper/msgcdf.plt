set term postscript
set output "msgsperquery.ps"
# Input file contains comma-separated values fields
set datafile separator ","
     
#set size 0.55,0.9
#set logscale y 10
#set xtics 0,100
#set mytics 10
#set mxtics 3

#set xtics {\
#  "0-100"      0,\
#  "101-200"      100,\
#  "201-300"      200,\
#  "301-400"      300,\
#  "401-500"       400,\
#  "501-600"      500,\
#  "601-700"      600,\
#  "701-800"      700,\
#  "801-900"      800,\
#  "901-1000"      900)
 # "1001-1100"      1000,\
 # "1101-1200"      1100,\
 # "1201-1300"      1200,\
 # "1301-1400"      1300,\
 # "1401-1500"      1400,\
 # "1501-1600"      1500,\
 # "1601-1700"      1600,\
 # "1701-1800"      1700,\
 # "1801-1900"      1800,\
 # "1901-2000"      1900,\
 # "2001-2500"      2000,\
 # "2500-5000"      2500}

set xlabel "Number of Messages"
set ylabel "Probability"
#set xrange [ 0 : 22 ] 
#set yrange [ 0 : 100 ]

#set label "9.99 MeV (x100)"   at 100,10
#set label "8.03(x10)"         at 50,2.5
#set label "5.0 MeV"           at 70,0.03
#set label "2.0 MeV (x0.01)"   at 90,0.008

#set linestyle 1 lt 1 pt 7 ps 0.7
#set linestyle 2 lt 1 pt 8 ps 0.7
#set linestyle 1 lt 1 lw 1
#set linestyle 2 lt 2 lw 2
#set linestyle 3 lt 3 lw 3

plot  "msgsperquery_floodingFL5.csv"  using 1:4  title "Flooding(ttl=4) CDF"  with lines,\
	"msgsperquery_RwalkRW5.csv"  using 1:4  title "Randomwalk (4 walkers) CDF"     with lines,\
	"msgsperquery_FIB10kFL5.csv"  using 1:4  title "Floating Indexes (flooding ttl=4) CDF"     with lines,\
	"msgsperquery_FIB10kRndRW5.csv"  using 1:4  title "Floating Indexes (randomwalk walkers=4) CDF"     with lines,\
	"msgsperquery_FID10kRndRW5.csv"  using 1:4  title "Floating Indexes (Depthwise randomwalk walkers=4) CDF"     with lines,\
	"msgsperquery_fuzzyFIRW5.csv"  using 1:4  title "Floating Indexes (fuzzy randomwalk walkers=4) CDF"     with lines,\
	"msgsperquery_ABFRW5.csv"  using 1:4  title "Attenuated Bloomfilters (depth=3, randomwalk walkers=4) CDF"     with lines,\
	"msgsperquery_ABFL2RW5.csv"  using 1:4  title "Attenuated Bloomfilters (depth=2, randomwalk walkers=4) CDF"     with lines

reset
pause -1
