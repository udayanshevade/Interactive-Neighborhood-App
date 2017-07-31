function GDouglasPeuker (source, kink) {

  var n_source, n_stack, n_dest, start, end, i, sig;
  var dev_sqr, max_dev_sqr, band_sqr;
  var x12, y12, d12, x13, y13, d13, x23, y23, d23;
  var F = ((Math.PI / 180.0) * 0.5 );
  var index = new Array();
  var sig_start = new Array();
  var sig_end = new Array();

  if ( source.length < 3 ) {
    return(source);
  }

  n_source = source.length;
  band_sqr = kink * 360.0 / (2.0 * Math.PI * 6378137.0);
  band_sqr *= band_sqr;
  n_dest = 0;
  sig_start[0] = 0;
  sig_end[0] = n_source-1;
  n_stack = 1;

  while ( n_stack > 0 ) {

    start = sig_start[n_stack-1];
    end = sig_end[n_stack-1];
    n_stack--;

    if ( (end - start) > 1 ) {
      x12 = (source[end].lng() - source[start].lng());
      y12 = (source[end].lat() - source[start].lat());
      if (Math.abs(x12) > 180.0) {
        x12 = 360.0 - Math.abs(x12);
      }

      x12 *= Math.cos(F * (source[end].lat() + source[start].lat()));
      d12 = (x12*x12) + (y12*y12);

      for ( i = start + 1, sig = start, max_dev_sqr = -1.0; i < end; i++ ) {
        x13 = (source[i].lng() - source[start].lng());
        y13 = (source[i].lat() - source[start].lat());
        if (Math.abs(x13) > 180.0) {
          x13 = 360.0 - Math.abs(x13);
        }

        x13 *= Math.cos (F * (source[i].lat() + source[start].lat()));
        d13 = (x13*x13) + (y13*y13);

        x23 = (source[i].lng() - source[end].lng());
        y23 = (source[i].lat() - source[end].lat());
        if (Math.abs(x23) > 180.0) {
          x23 = 360.0 - Math.abs(x23);
        }

        x23 *= Math.cos(F * (source[i].lat() + source[end].lat()));
        d23 = (x23*x23) + (y23*y23);

        if ( d13 >= ( d12 + d23 ) ) {
          dev_sqr = d23;
        } else if ( d23 >= ( d12 + d13 ) ) {
          dev_sqr = d13;
        } else {
          dev_sqr = (x13 * y12 - y13 * x12) * (x13 * y12 - y13 * x12) / d12;// solve triangle
        }

        if ( dev_sqr > max_dev_sqr  ) {
          sig = i;
          max_dev_sqr = dev_sqr;
        }

      }

      if ( max_dev_sqr < band_sqr ) {
        index[n_dest] = start;
        n_dest++;
      } else {
        n_stack++;
        sig_start[n_stack-1] = sig;
        sig_end[n_stack-1] = end;
        n_stack++;
        sig_start[n_stack-1] = start;
        sig_end[n_stack-1] = sig;
      }
    }
    else{
      index[n_dest] = start;
      n_dest++;
    }
  }

  index[n_dest] = n_source-1;
  n_dest++;

  var r = new Array();
  for(var i=0; i < n_dest; i++) {
    r.push(source[index[i]]);
  }
  return r;
}