/* MAIN SCRIPOT TO LOAD CARDS APPLICATIONS */

var data_table;
var re =  new RegExp('_','g');

function empty_table(new_id){
  var card = '<div id="'+new_id+'-card" class="card"><div class="card-header">';
  card += '<div class="row"><div class="col-sm-5">';
  card += '<h1>'+new_id.replace(re,' ').toUpperCase()+' coverage</h1>';
  card += '</div><div class="col-sm-7"><div id="'+new_id+'-pie-chart" style="height: 100%;min-height:200px;"></div></div></div>';
  card += '<div class="card-body"><i class="fas fa-2x fa-caret-square-up open-table open-table-close"></i>';
  card += '<table id="'+new_id+'" class="table display globalk" style="width:100%"><thead><tr></tr></thead><tbody></tbody><tfoot><tr></tr></tfoot></table>';
  card +='</div></div>';
  return card;
}

jQuery.fn.dataTable.Api.register( 'sum()', function ( ) {
    return this.flatten().reduce( function ( a, b ) {
        if ( typeof a === 'string' ) {
            a = a.replace(/[^\d.-]/g, '') * 1;
        }
        if ( typeof b === 'string' ) {
            b = b.replace(/[^\d.-]/g, '') * 1;
        }

        return a + b;
    }, 0 );
} );

jQuery(document).ready(function($) {

  var global_protection = {'marine':0,'land':0,'prot':0};
  var last = false;

  function draw_pie_chart(idelem,prot_m=0,prot_t=0,not_prot=0){
    var dom = document.getElementById(idelem);
    var myChart = echarts.init(dom);

    //...with Marine... missing the total area of Marine to compute correctly TODO
    //var perc = ( 100.0* (prot_t + prot_m) / (not_prot + prot_t + prot_m ) ).toFixed(1).toString() + ' %';

    //...withouth marine
    var perc = ( 100.0* (prot_t ) / (not_prot + prot_t  ) ).toFixed(1).toString() + ' %';

    $('#'+idelem).prepend('<h1 style="position:absolute;right:0;top:0;color:#8FBF4B;">'+perc+'</h1>');
    var app = {};
    option = null;
    app.title = 'Protection Coverage';

    option = {
        color:[
//          '#8eb4b1',  //marine
          '#8FBF4B', //terrestrial
          '#ddd'], // not protected
        tooltip: {
            show: true,
            trigger: 'item',
            formatter: "{d}%"//"{a} <br/>{b}: {c} ({d}%)"
        },
        legend: {
            show: false,
            orient: 'vertical',
            x: '0%',
            y: '0%',
            data:[
  //            'Marine Protected',
              'Land Protected',
              'Land Not Protected',
            ]
        },
        series: [
            {
                name:'Coverage',
                type:'pie',
                radius: ['40%', '80%'],
                avoidLabelOverlap: true,
                label: {
                    normal: {
                        show: true,
                        position: 'left',
                        textStyle: {
                            fontSize: '15',
                            fontWeight: 'bold'
                        }
                    },
                    emphasis: {
                        show: true,
                        textStyle: {
                            fontSize: '15',
                            fontWeight: 'bold'
                        }
                    }
                },
                labelLine: {
                    normal: {
                        show: true
                    }
                },
                data:[
//                    {value:prot_m, name:'Marine Protected'},
                    {value:prot_t, name:'Land Protected'},
                    {value:not_prot, name:'Land Not Protected'},
                ]
            }
        ]
    };
    ;
    if (option && typeof option === "object") {
        myChart.setOption(option, true);
    }
  };

  function draw_table(new_id,data,last=false){
      var tab_html = $(empty_table(new_id));
      $('#globalk-tables').append(tab_html);

      setTimeout(function(){
        var headers = Object.keys(data[0]);
        $.each(headers, function(idx,val){
          var re = new RegExp('_','g');
          $('#'+new_id+' thead tr').append('<th>'+val.replace(re,' ')+'</th>')
        });
        $.each(data,function(idx,record){
            var tr ='<tr>';
            $.each(record,function(key,val){
              tr+='<td>'+val+'</td>';
            });
            tr+='</tr>';
            $('#'+new_id+' tbody').append(tr);
        });

      if ( ! $.fn.DataTable.isDataTable( '#'+new_id ) ) {
        $('#'+new_id).DataTable({
          dom: 'Bfrtip',
          buttons: [
              'print','excel','copy','csv'
          ],
          "paging": false,
          "searching": false,
          drawCallback: function () {
            var api = this.api();
            var region = new_id.replace(re,' ').toUpperCase();
            var n_country = api.rows().count();//Math.round(api.column( 1, {page:'current'} ).data().sum());
            var pop = Math.round(api.column( 3, {page:'current'} ).data().sum());
            var land = Math.round(api.column( 4, {page:'current'} ).data().sum());
            var prot_m = Math.round(api.column( 5, {page:'current'} ).data().sum());
            var prot_t = Math.round(api.column( 6, {page:'current'} ).data().sum());
            var prot_tot = Math.round(api.column( 7, {page:'current'} ).data().sum());
            var footer = '<td>'+region+'</td><td>'+n_country.toString()+' countries</td><td>-</td><td>'+pop.toString();
            footer += '</td><td>'+land.toString();
            footer += '</td><td>'+prot_m.toString();
            footer += '</td><td>'+prot_t.toString();
            footer += '</td><td>'+prot_tot.toString()+'</td>';
            $( api.table().footer() ).html(footer);

            //draw pie chart based on totals computed
            draw_pie_chart(new_id+'-pie-chart',prot_m,prot_t,land - prot_t);
            global_protection['marine']+= land;
            global_protection['land']+= land;
            global_protection['prot']+= prot_t;
            if (last){
              setTimeout(function(){
                console.log(global_protection);
                draw_pie_chart('ACP-pie-chart',global_protection["marine"],global_protection["prot"],global_protection["land"] - global_protection["prot"]);
                var global_prot_land = Math.round((parseInt(global_protection["prot"])/1000)).toLocaleString();
                $('#ACP-card .col-sm-5').append('<h6>Total ACP Protected Land (1000 x km<sup>2</sup>) = <b>'+global_prot_land+' </b></h6>');
              },200);
            }
          }
      });
     };
   },200);

      //$('#'+new_id+'-card .card-body tbody').hide();
      $('#'+new_id+'-card .card-header .open-table').on('click',function(){
        $('#'+new_id+'-card .card-body tbody').slideToggle();
        $(this).toggleClass('open-table-close');
      });
  }

  Drupal.attachBehaviors($("#globalk-tables"));
  Drupal.attachBehaviors($("#data-sources"));

 var sources = [
   {"source":"The World Bank",
   "url":"https://data.worldbank.org/indicator/ag.lnd.totl.k2",
   "data":"[2018] Land area (sq. km)",
   "icon":"https://data.worldbank.org/assets/images/logo-wb-header-en.svg"
 },
 {"source":"The World Bank",
 "url":"https://data.worldbank.org/indicator/SP.POP.TOTL?view=chart",
 "data":"[2018] Population, total",
 "icon":"https://data.worldbank.org/assets/images/logo-wb-header-en.svg"
},
{"source":"Dopa-services",
"url":"https://rest-services.jrc.ec.europa.eu/services/d6dopa40/administrative_units/get_country_all_inds",
"data":"Protected Area Marine/Terrestrial (sq. km)",
"icon":"https://dopa-explorer.jrc.ec.europa.eu/sites/default/files/dopa_logo_wo3.png"
},
];

 var regions = {};

 var rest_url = "https://rest-services.jrc.ec.europa.eu/services/d6biopamarest/d6biopama/get_tmp_acp_pa_stat?format=json";
 var data_tables= $.getJSON( rest_url ,function(data){
   //console.log(data.records);
   $.each(data.records,function(idx,obj){
     regions[obj['region']] = [];
   });
   $.each(data.records,function(idx,obj){
     regions[obj['region']].push(obj);
   });
   var ri=0;
   var last_r = 6;
   $.each(regions,function(key, val){
     ri+=1;
     if (ri == last_r){
//       alert('duccio');
       draw_table(key.toLowerCase().replace(' ','_'),val,last=true);
     }else{
       draw_table(key.toLowerCase().replace(' ','_'),val);
     }
     //console.log(val);
   });
 })

 $.each(sources,function(idx,obj){
   $('#data-sources').append('\
   <div class="card">\
    <div class="card-body">\
     <div class="row">\
      <div class="col-sm-2"><img src="' + obj['icon'] + '">"</div>\
      <div class="col-sm-10"><span style="color:#8eb4b1;">'+obj['data']+' Source: </span><a href="'+obj['url']+'"><div class="btn btn-light">' +obj['source']+ '</div></a></div>\
     </div>\
    </div>\
   </div>');

 });

});
